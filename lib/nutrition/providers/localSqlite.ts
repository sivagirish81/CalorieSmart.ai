import { NutritionProvider, ParsedFoodItem } from "../types";
import { prisma } from "@/lib/db";

export class LocalSqliteProvider implements NutritionProvider {
  async parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]> {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase().trim();

    // Try full query match first (handles compound names like "mutton ghee roast biryani")
    const fullMatch = await prisma.localFoodDictionary.findFirst({
      where: { name: { equals: normalizedQuery } }
    });

    if (fullMatch) {
      return [{
        name: fullMatch.name,
        serving_size_g: fullMatch.serving_size_g,
        nutrition: {
          calories: fullMatch.calories,
          protein_g: fullMatch.protein_g,
          carbohydrates_total_g: fullMatch.carbohydrates_total_g,
          fat_total_g: fullMatch.fat_total_g,
          sugar_g: 0,
          fiber_g: 0,
          sodium_mg: 0,
          cholesterol_mg: 0,
        }
      }];
    }

    const words = normalizedQuery.split(/\W+/);
    const results: ParsedFoodItem[] = [];
    let currentMultiplier = 1;

    for (const word of words) {
      const num = parseInt(word);
      if (!isNaN(num)) {
        currentMultiplier = num;
        continue;
      }

      if (word.length <= 2) {
        currentMultiplier = 1;
        continue;
      }

      const singularWord = word.endsWith('s') ? word.slice(0, -1) : word;
      const food = await prisma.localFoodDictionary.findFirst({
        where: {
          name: {
            equals: singularWord,
          }
        }
      });

      if (food) {
        results.push({
          name: food.name,
          serving_size_g: food.serving_size_g * currentMultiplier,
          nutrition: {
            calories: food.calories * currentMultiplier,
            protein_g: food.protein_g * currentMultiplier,
            carbohydrates_total_g: food.carbohydrates_total_g * currentMultiplier,
            fat_total_g: food.fat_total_g * currentMultiplier,
            sugar_g: 0,
            fiber_g: 0,
            sodium_mg: 0,
            cholesterol_mg: 0,
          }
        });
        currentMultiplier = 1;
      }
    }

    if (results.length === 0 && words.length > 0) {
      return [{
        name: "Unknown Local Food",
        serving_size_g: 100,
        nutrition: {
          calories: 100,
          protein_g: 5,
          carbohydrates_total_g: 10,
          fat_total_g: 5,
        }
      }];
    }

    return results;
  }
}
