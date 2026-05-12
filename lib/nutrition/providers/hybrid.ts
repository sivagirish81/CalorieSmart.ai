import { NutritionProvider, ParsedFoodItem } from "../types";
import { LocalSqliteProvider } from "./localSqlite";
import { CalorieNinjasProvider } from "./calorieNinjas";
import { prisma } from "@/lib/db";

export class HybridNutritionProvider implements NutritionProvider {
  private localProvider = new LocalSqliteProvider();
  private apiProvider = new CalorieNinjasProvider();

  async parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]> {
    if (!query) return [];

    console.log(`[Hybrid Provider] Query: "${query}"`);

    const localResults = await this.localProvider.parseNaturalLanguage(query);

    const isUnknownFallback = localResults.length === 1 && localResults[0].name === "Unknown Local Food";
    const isEmpty = localResults.length === 0;

    const isComplexQuery = query.toLowerCase().includes(" and ") || query.includes(",") || query.toLowerCase().includes(" with ");

    const queryKeywords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const coveredKeywords = new Set(localResults.flatMap(r => r.name.toLowerCase().split(/\W+/)));
    const isPartialMatch = !isUnknownFallback && !isEmpty &&
      queryKeywords.some(w => !coveredKeywords.has(w));

    if (!isUnknownFallback && !isEmpty && !isComplexQuery && !isPartialMatch) {
      console.log(`[Hybrid Provider] Local Cache HIT! Serving from SQLite.`);
      return localResults;
    }

    if (isPartialMatch) {
      console.log(`[Hybrid Provider] Partial keyword match — falling back to API...`);
    } else {
      console.log(`[Hybrid Provider] Local Cache MISS. Falling back to live API...`);
    }

    // 2. Fall back to external CalorieNinjas API
    let apiResults: ParsedFoodItem[] = [];
    try {
      apiResults = await this.apiProvider.parseNaturalLanguage(query);
    } catch (e) {
      console.error("[Hybrid Provider] API failed:", e);
      return [];
    }

    console.log(`[Hybrid Provider] Caching ${apiResults.length} new items to SQLite...`);
    for (const item of apiResults) {
      const normalizedName = item.name.toLowerCase();
      try {
        await prisma.localFoodDictionary.upsert({
          where: { name: normalizedName },
          update: {},
          create: {
            name: normalizedName,
            calories: item.nutrition.calories,
            protein_g: item.nutrition.protein_g,
            carbohydrates_total_g: item.nutrition.carbohydrates_total_g,
            fat_total_g: item.nutrition.fat_total_g,
            serving_size_g: item.serving_size_g,
          }
        });
      } catch (e) {
        console.error(`[Hybrid Provider] Failed to cache item: ${normalizedName}`, e);
      }
    }

    return apiResults;
  }
}
