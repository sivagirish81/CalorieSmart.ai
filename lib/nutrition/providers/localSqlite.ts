import { NutritionProvider, ParsedFoodItem } from "../types";
import { prisma } from "@/lib/db";

export class LocalSqliteProvider implements NutritionProvider {
  async parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]> {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase();
    const words = normalizedQuery.split(/\W+/);
    
    // Simple mock NLP: look for matching dictionary items in the user's query
    const results: ParsedFoodItem[] = [];

    // Extract quantities (basic)
    let currentMultiplier = 1;

    for (const word of words) {
      // Basic number parsing
      const num = parseInt(word);
      if (!isNaN(num)) {
        currentMultiplier = num;
        continue;
      }

      if (word.length <= 2) {
        currentMultiplier = 1; // Reset on small words
        continue;
      }

      // Very basic singularization
      const singularWord = word.endsWith('s') ? word.slice(0, -1) : word;

      // Search DB with strict equals
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
        
        // Reset multiplier for the next item
        currentMultiplier = 1;
      }
    }

    // If we didn't find anything but the user typed something, return a fallback so it doesn't just error out silently
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
