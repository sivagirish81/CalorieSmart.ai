"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import Groq from "groq-sdk";
import { getDayBounds } from "@/lib/time";
import { analyzeMeal, saveMealLog } from "@/app/search/actions";
import { ParsedFoodItem } from "@/lib/nutrition/types";
import { revalidatePath } from "next/cache";

type ChatMessage = { role: 'user' | 'ai'; content: string };

// ── Intent detectors ──────────────────────────────────────────────────────────
function looksLikeFoodLog(msg: string): boolean {
    // Past tense — already ate
    const past = /\b(i (ate|had|just ate|just had|'ve eaten|'m eating|am eating|finished|just finished)|just (ate|had|finished eating)|had (a |an |some |my )|ate (a |an |some )|i('m| am) eating|having (a |an |some |my ))/i.test(msg);
    // Future / planning intent — wants to eat something specific
    const future = /\b(i (want to (have|eat|get)|will (have|eat)|'ll (have|eat))|going to (have|eat)|i('m| am) going to (have|eat)|i('m| am) having|can you log|log (a |an |some |it|this|that|them)?)\b/i.test(msg);
    return past || future;
}

function looksLikeConfirmation(msg: string): boolean {
    return /\b(yes|yep|yeah|yup|sure|ok|okay|log it|log that|log this|log them|do it|correct|go ahead|sounds right|that('s| is) right|confirm|add it|save it|looks good|perfect|right|exactly|please)\b/i.test(msg);
}

function looksLikeCancellation(msg: string): boolean {
    return /\b(no|nope|nah|cancel|nevermind|never mind|don'?t log|skip|wrong|not right|discard|remove|forget it)\b/i.test(msg);
}

// Matches "add X to favorites", "save X as favorite", "favorite this", "mark X as fav", etc.
// Does NOT match "my favorite X" without add/save/mark intent
function looksLikeFavoriteIntent(msg: string): boolean {
    return /\b(add|save|mark|set|put)\b.{0,40}\b(fav(ou?rite)?s?)\b/i.test(msg) ||
           /\bto\s+(my\s+)?fav(ou?rite)?s?\b/i.test(msg) ||
           /\bfav(ou?rite)?\s+(this|it|that)\b/i.test(msg) ||
           /\bsave\s+(this|it|that)\b/i.test(msg);
}

// Extract the food name the user wants to favorite, using conversation context for pronouns
async function extractFavoriteFood(groq: Groq, message: string, recentContext: string): Promise<string> {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `Extract ONLY the food name the user wants to add to their favorites list. Return just the food name, nothing else.
If they use pronouns like "this", "it", "that", resolve them using the recent conversation context provided.
If no specific food can be determined, return an empty string.
Recent context: ${recentContext}
Examples:
"add chicken biryani to favorites" → "chicken biryani"
"save the SJSU protein bowl as a favorite" → "SJSU Dining Protein Bowl"
"mark pizza as fav" → "pizza"
"add this to my favorites" (context mentions biryani) → "chicken biryani"
"favorite it" (context mentions oatmeal) → "oatmeal"`
            },
            { role: "user", content: message }
        ],
        max_tokens: 20,
        temperature: 0,
    });
    return completion.choices[0]?.message?.content?.trim() || "";
}

// Extract a gram amount from messages like "actually 300g" or "make it 200g"
function extractServingG(msg: string): number | null {
    const gMatch = msg.match(/(\d+(?:\.\d+)?)\s*g\b/i);
    if (gMatch) return parseFloat(gMatch[1]);
    const ozMatch = msg.match(/(\d+(?:\.\d+)?)\s*oz\b/i);
    if (ozMatch) return Math.round(parseFloat(ozMatch[1]) * 28.35);
    return null;
}

function getMealType(hour: number): string {
    if (hour < 11) return "Breakfast";
    if (hour < 16) return "Lunch";
    if (hour < 21) return "Dinner";
    return "Snack";
}

// Strip conversational text, return just the food item(s).
// Uses recent conversation context to resolve pronouns ("it", "that") and
// partial references ("2" → "2 gulab jamun" when context mentions gulab jamun).
async function extractFoodFromMessage(groq: Groq, message: string, recentContext = ""): Promise<string> {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `Extract ONLY the food item(s) and quantity from the message. Return just the food description with no extra words.
If the message uses pronouns (it, this, that, them) or partial references (just a number like "2"), resolve the COMPLETE food name using the recent conversation context below.
IMPORTANT: Always preserve the FULL compound food name — never shorten it. "apple pie" stays "apple pie", not "apple". "chicken biryani" stays "chicken biryani", not "chicken". "gulab jamun" stays "gulab jamun".
${recentContext ? `Recent conversation context:\n${recentContext}` : ""}
Examples:
"I ate 2 slices of apple pie" → "2 slices apple pie"
"i will have a piece of it" (context mentions apple pie) → "apple pie"
"i will have 2" (context mentions gulab jamun) → "2 gulab jamun"
"log it" (context: 2 gulab jamun) → "2 gulab jamun"
"just had chicken biryani for lunch" → "chicken biryani"
"I'm eating a banana and some almonds" → "banana, almonds"
Return an empty string only if no food can be inferred at all.`
            },
            { role: "user", content: message }
        ],
        max_tokens: 40,
        temperature: 0,
    });
    return completion.choices[0]?.message?.content?.trim() || "";
}

export async function processSuggestionChat(
    userInput?: string,
    currentLocalTime?: string,
    conversationHistory?: ChatMessage[],
    pendingItems?: ParsedFoodItem[]
) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key" });
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) throw new Error("User missing");

    const { startOfDay, endOfDay } = getDayBounds(user.timezone);

    const todaysMeals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
        include: { items: true }
    });

    let consumed = 0;
    todaysMeals.forEach(log => log.items.forEach(item => { consumed += item.calories; }));

    const todaysExercise = await prisma.exerciseLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } }
    });
    const burned = todaysExercise.reduce((s, l) => s + l.caloriesBurned, 0);

    const hour = currentLocalTime ? parseInt(currentLocalTime.split(":")[0]) : new Date().getHours();
    const mealType = getMealType(hour);

    // ── Pending-items state machine ───────────────────────────────────────────
    let loggedItems: Array<{ name: string; calories: number }> = [];
    let newPendingItems: ParsedFoodItem[] | undefined;

    if (pendingItems && pendingItems.length > 0) {
        if (userInput && looksLikeConfirmation(userInput)) {
            await saveMealLog(pendingItems, mealType);
            loggedItems = pendingItems.map(item => ({
                name: item.name,
                calories: Math.round(item.nutrition.calories),
            }));
            consumed += pendingItems.reduce((s, item) => s + item.nutrition.calories, 0);

        } else if (userInput && looksLikeCancellation(userInput)) {
            // newPendingItems stays undefined

        } else if (userInput) {
            const newServing = extractServingG(userInput);
            if (newServing && newServing > 0) {
                newPendingItems = pendingItems.map(item => {
                    const ratio = newServing / item.serving_size_g;
                    return {
                        ...item,
                        serving_size_g: newServing,
                        nutrition: {
                            calories: Math.round(item.nutrition.calories * ratio),
                            protein_g: Math.round(item.nutrition.protein_g * ratio * 10) / 10,
                            carbohydrates_total_g: Math.round(item.nutrition.carbohydrates_total_g * ratio * 10) / 10,
                            fat_total_g: Math.round(item.nutrition.fat_total_g * ratio * 10) / 10,
                        }
                    };
                });
            } else {
                newPendingItems = pendingItems;
            }
        }

    } else if (userInput && looksLikeFoodLog(userInput)) {
        try {
            const recentCtx = (conversationHistory || [])
                .slice(-4)
                .map(m => `${m.role === 'ai' ? 'Coach' : 'User'}: ${m.content}`)
                .join('\n');
            const foodQuery = await extractFoodFromMessage(groq, userInput, recentCtx);
            console.log(`[Coach] Extracted food query: "${foodQuery}" from: "${userInput}"`);
            if (foodQuery && !['it','this','that','them',''].includes(foodQuery.toLowerCase())) {
                const result = await analyzeMeal(foodQuery);
                if (result.success && result.data && result.data.length > 0) {
                    newPendingItems = result.data;
                }
            }
        } catch (e) {
            console.error("[Coach] Food analysis failed:", e);
        }
    }

    // ── Favorite intent (independent of pending flow) ─────────────────────────
    let favoritedItem: { name: string; isNew: boolean } | undefined;

    if (userInput && looksLikeFavoriteIntent(userInput)) {
        // Resolve food name — use pending items if pronouns ("this/it/that")
        let foodName = "";
        if (pendingItems && pendingItems.length > 0) {
            foodName = pendingItems[0].name;
        } else {
            const recentAI = (conversationHistory || []).filter(m => m.role === 'ai').slice(-1)[0]?.content || '';
            foodName = await extractFavoriteFood(groq, userInput, recentAI);
        }

        const ignoredPronouns = ['this', 'it', 'that', ''];
        if (foodName && !ignoredPronouns.includes(foodName.toLowerCase())) {
            // Look for existing custom food (case-insensitive fuzzy match)
            const existing = await prisma.customFood.findFirst({
                where: { userId: user.id, name: { contains: foodName } }
            });

            if (existing) {
                if (!existing.isFavorite) {
                    await prisma.customFood.update({ where: { id: existing.id }, data: { isFavorite: true } });
                }
                favoritedItem = { name: existing.name, isNew: false };
            } else {
                // Food not in custom list yet — analyze it and add it as a favorite
                try {
                    const result = await analyzeMeal(foodName);
                    if (result.success && result.data && result.data.length > 0) {
                        const item = result.data[0];
                        await prisma.customFood.create({
                            data: {
                                userId: user.id,
                                name: item.name,
                                calories: Math.round(item.nutrition.calories),
                                protein: item.nutrition.protein_g,
                                carbs: item.nutrition.carbohydrates_total_g,
                                fat: item.nutrition.fat_total_g,
                                servingSizeG: item.serving_size_g,
                                isFavorite: true,
                            }
                        });
                        favoritedItem = { name: item.name, isNew: true };
                    }
                } catch (e) {
                    console.error("[Coach] Favorite creation failed:", e);
                }
            }
            revalidatePath("/");
            revalidatePath("/custom-food");
        }
    }

    const remaining = Math.max(0, user.calorieBound - consumed + burned);

    const customFoods = await prisma.customFood.findMany({
        where: { userId: user.id, calories: { lte: remaining } },
        orderBy: [{ isFavorite: 'desc' }, { calories: 'desc' }],
        take: 3
    });

    // ── Build system prompt with context note ─────────────────────────────────
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const mealsLogged = todaysMeals.map(log =>
        log.items.map(item => `${item.name} (${item.calories} kcal)`).join(", ")
    ).join("; ") || "nothing logged yet";

    let contextNote = "";
    if (favoritedItem) {
        contextNote = ` You just added "${favoritedItem.name}" to the user's favorites${favoritedItem.isNew ? ' (also added it to their custom foods list with estimated nutrition)' : ''}. Confirm it with a ♥ emoji and keep it brief.`;
    } else if (newPendingItems && newPendingItems.length > 0) {
        const itemDesc = newPendingItems.map(i =>
            `${i.name} — ${Math.round(i.nutrition.calories)} kcal (${i.serving_size_g}g, P:${i.nutrition.protein_g}g C:${i.nutrition.carbohydrates_total_g}g F:${i.nutrition.fat_total_g}g)`
        ).join('; ');
        contextNote = ` You detected the following food to log: ${itemDesc}. Tell the user what you found with the calorie count and ask them to say "yes" to log it, or give a different gram amount if the portion was different. 2 sentences max.`;
    } else if (loggedItems.length > 0) {
        contextNote = ` You just successfully logged: ${loggedItems.map(i => `${i.name} (${i.calories} kcal)`).join(', ')}. Confirm it's saved and note the updated remaining budget of ${remaining} kcal.`;
    } else if (pendingItems && pendingItems.length > 0 && userInput && looksLikeCancellation(userInput)) {
        contextNote = ` The user chose not to log. Acknowledge briefly and offer to help with something else.`;
    }

    const systemPrompt = `You are a friendly, concise nutrition coach inside a calorie tracking app.
The user's daily calorie limit is ${user.calorieBound} kcal.
They follow a ${user.dietaryPreference || "omnivore"} diet.
Protein goal: ${user.proteinGoalG || "not set"}g, Carbs goal: ${user.carbsGoalG || "not set"}g, Fat goal: ${user.fatGoalG || "not set"}g.
Today (${timeOfDay}): consumed ${Math.round(consumed)} kcal, burned ${burned} kcal through exercise, ${remaining} kcal remaining.
Meals logged today: ${mealsLogged}.${contextNote}
CRITICAL RULES:
1. Never calculate or state what remaining calories WOULD BE after a hypothetical meal. Only quote the current actual remaining calories (${remaining} kcal). Do NOT do subtraction math for unlogged food.
2. Never say you have logged, saved, or recorded food unless the system explicitly tells you it was logged. If the user asks you to log something but the system hasn't confirmed it, tell them you're waiting for their confirmation via the pending card.
3. DIETARY CONFLICTS: If the user mentions a food that conflicts with their stated diet, gently point it out first before anything else. Examples: a vegan asking about chicken biryani, a vegetarian asking about beef, a pescatarian asking about steak. Be kind but clear — say something like "Heads up, [food] contains [meat/dairy/etc.] which doesn't match your [diet] preference. Did you mean a [plant-based/veg] version?" Then offer an alternative that fits their diet.
Keep responses under 3 sentences. Be specific, practical, and encouraging. Never suggest water tracking.`;

    const historyMessages = (conversationHistory || []).map(m => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
    }));

    const currentMessage = userInput
        ? { role: "user" as const, content: userInput }
        : { role: "user" as const, content: `Give me a meal suggestion for this ${timeOfDay} based on my remaining calories and diet preference.` };

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            currentMessage,
        ],
        max_tokens: 150,
        temperature: 0.7,
    });

    const suggestionText = completion.choices[0]?.message?.content || "I couldn't generate a suggestion right now. Try again!";

    return {
        remaining,
        suggestionText,
        customFoods: customFoods.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })),
        promptForInput: true,
        loggedItems,
        pendingItems: newPendingItems,
        favoritedItem,
    };
}
