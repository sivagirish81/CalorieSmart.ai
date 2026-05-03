"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { analyzeMeal } from "@/app/search/actions";

export async function processSuggestionChat(userInput?: string, currentLocalTime?: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) throw new Error("User missing");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysMeals = await prisma.mealLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
        include: { items: true }
    });

    let consumed = 0;
    todaysMeals.forEach((log: { items: Array<{ calories: number }> }) => {
        log.items.forEach((item: { calories: number }) => { consumed += item.calories; });
    });

    const limit = user.calorieBound;
    let remaining = Math.max(0, limit - consumed);

    const customFoods = await prisma.customFood.findMany({
        where: { userId: user.id, calories: { lte: remaining } },
        orderBy: { calories: 'desc' },
        take: 3
    });

    // Handle initial state with no user input
    if (!userInput) {
        // If they request suggestions after half day (12pm) and no logs
        const isAfternoon = currentLocalTime ? parseInt(currentLocalTime.split(":")[0]) >= 12 : new Date().getHours() >= 12;
        if (todaysMeals.length === 0 && isAfternoon) {
            return {
                remaining,
                suggestionText: "We noticed you haven't logged anything today. How hungry are you? Or did you already eat something?",
                customFoods: [],
                promptForInput: true
            };
        }

        // Base suggestions
        if (remaining <= 0) return { remaining, suggestionText: "You have reached your limit for today. Make sure to hydrate!", customFoods: [], promptForInput: false };
        if (remaining < 150) return { remaining, suggestionText: "You are very near your limit! Consider a small snack like an apple, cucumber slices, or a handful of almonds (approx 50-80 kcal).", customFoods: [], promptForInput: false };
        
        const prompts = {
           "Omnivore": `You have ${remaining} calories remaining. Consider a balanced meal like grilled chicken breast with vegetables, or a tuna sandwich to hit your macros while staying under ${remaining} kcal.`,
           "Vegetarian": `You have ${remaining} calories remaining. Consider a meal like lentil soup with a side salad, or tofu stir-fry to get good protein while staying under ${remaining} kcal.`,
           "Vegan": `You have ${remaining} calories remaining. A black bean bowl with quinoa and avocado would be great, just portion it to fit within ${remaining} kcal.`,
           "Keto": `You have ${remaining} calories remaining. Salmon with asparagus, or a cobb salad with eggs and bacon, keeps carbs low while staying under ${remaining} kcal.`
        };
        const text = (prompts as Record<string, string>)[user.dietaryPreference] || `You have ${remaining} calories remaining!`;
        return { remaining, suggestionText: text, customFoods, promptForInput: true };
    }

    // Handle user input
    const normalizedInput = userInput.toLowerCase();
    
    // Check if the user is just saying they are hungry without describing food
    if (normalizedInput.includes("hungry") && !normalizedInput.includes("ate") && !normalizedInput.includes("had") && !normalizedInput.includes("not hungry")) {
         return { 
            remaining, 
            suggestionText: `Got it! Since you are hungry, let's look at some bigger meals. You have ${remaining} calories left. How about a filling steak salad, a hearty quinoa bowl, or a substantial chicken wrap?`, 
            customFoods, 
            promptForInput: true 
         };
    }

    if (normalizedInput.includes("don't feel like eating") || normalizedInput.includes("dont feel like eating") || normalizedInput.includes("not hungry")) {
         return { 
            remaining, 
            suggestionText: `Yeah, some days are just like that! If you are really not up for it, I'd suggest reducing your calorie goal by a little today and just focusing on staying hydrated.`, 
            customFoods: [], 
            promptForInput: true 
         };
    }

    if (normalizedInput.includes("uneasy") || normalizedInput.includes("emotional") || normalizedInput.includes("sad")) {
        const favorite = await prisma.customFood.findFirst({
            where: { userId: user.id, isFavorite: true },
        });
        
        if (favorite) {
            return {
                remaining,
                suggestionText: `If you feel physically uneasy, you should consider seeing a doctor. But if it's just emotional, sometimes your favorite dish helps! How about we log some ${favorite.name}?`,
                customFoods: [favorite],
                promptForInput: true
            };
        } else {
            return {
                remaining,
                suggestionText: `If you feel physically uneasy, you should consider seeing a doctor. But if it's just emotional, sometimes eating something you love helps. Why not mark a favorite dish using the custom food page?`,
                customFoods: [],
                promptForInput: true
            };
        }
    }

    // Attempt to parse out food and auto log it
    const analysis = await analyzeMeal(userInput);
    
    if (analysis.success && analysis.data && analysis.data.length > 0) {
         let logDate = new Date();
         let type = "Breakfast";
         const hasTime = userInput.match(/(?:at|around)\s+(\d+(?::\d+)?\s*(?:am|pm)?)/i);
         let timeMessage = "I am autologging this. You can correct the timing, meal type, or delete it in your history if needed.";
         
         if (hasTime) {
             const timeRaw = hasTime[1].toLowerCase();
             let hours = parseInt(timeRaw);
             const isPm = timeRaw.includes("pm");
             const isAm = timeRaw.includes("am");
             
             if (isPm && hours < 12) hours += 12;
             if (isAm && hours === 12) hours = 0;
             let minutes = 0;
             if (timeRaw.includes(':')) minutes = parseInt(timeRaw.split(':')[1]);
             
             logDate.setHours(hours, minutes, 0, 0);
             timeMessage = `I logged this for ${hasTime[1]}. You can correct the timing if needed.`;
             
             if (hours >= 12 && hours < 17) type = "Lunch";
             else if (hours >= 17) type = "Dinner";
         }

         await prisma.mealLog.create({
             data: {
                 userId: user.id,
                 type: type,
                 date: logDate,
                 items: {
                     create: analysis.data.map(item => ({
                         name: item.name,
                         calories: item.nutrition.calories,
                         protein: item.nutrition.protein_g,
                         carbs: item.nutrition.carbohydrates_total_g,
                         fat: item.nutrition.fat_total_g,
                         servingSizeG: item.serving_size_g,
                     }))
                 }
             }
         });

         const addedCalories = analysis.data.reduce((sum, item) => sum + item.nutrition.calories, 0);
         remaining = Math.max(0, remaining - addedCalories);
         
         return {
             remaining,
             suggestionText: `Great! I automatically logged: ${analysis.data.map(d=>d.name).join(", ")}. ${timeMessage} You have ${remaining} calories remaining!`,
             customFoods: [],
             promptForInput: true
         };
    } else {
        return {
             remaining,
             suggestionText: "I couldn't quite catch what you ate. Could you describe your food more clearly, or reply with how hungry you are?",
             customFoods: [],
             promptForInput: true
        };
    }
}
