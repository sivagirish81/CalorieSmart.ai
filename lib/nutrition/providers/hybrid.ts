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

    // 1. Try fetching from Local SQLite Database first
    const localResults = await this.localProvider.parseNaturalLanguage(query);

    // Check if the local provider failed to find anything useful
    const isUnknownFallback = localResults.length === 1 && localResults[0].name === "Unknown Local Food";
    const isEmpty = localResults.length === 0;

    // If the query contains conjunctions, it's likely a complex multi-item query (e.g., "donut AND pizza").
    // Our local SQLite parser is too basic to handle this accurately, so we bypass the cache and force a Live API hit.
    const isComplexQuery = query.toLowerCase().includes(" and ") || query.includes(",") || query.toLowerCase().includes(" with ");

    if (!isUnknownFallback && !isEmpty && !isComplexQuery) {
      console.log(`[Hybrid Provider] Local Cache HIT! Serving from SQLite.`);
      return localResults;
    }

    console.log(`[Hybrid Provider] Local Cache MISS. Falling back to live API...`);

    // 2. Fall back to external CalorieNinjas API
    let apiResults: ParsedFoodItem[] = [];
    try {
      apiResults = await this.apiProvider.parseNaturalLanguage(query);
    } catch (e) {
      console.error("[Hybrid Provider] API failed:", e);
      return [];
    }

    // 3. Save the newly discovered foods into the Local SQLite Database
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
