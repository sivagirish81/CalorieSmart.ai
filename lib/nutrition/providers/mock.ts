import { NutritionProvider, ParsedFoodItem } from "../types";

export class MockNutritionProvider implements NutritionProvider {
  async parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]> {
    console.log(`[MockNutritionProvider] Parsing query: "${query}"`);
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    return [
      {
        name: "avocado toast",
        serving_size_g: 150,
        nutrition: {
          calories: 250,
          protein_g: 5,
          carbohydrates_total_g: 22,
          fat_total_g: 18,
        }
      },
      {
        name: "latte (medium)",
        serving_size_g: 350,
        nutrition: {
          calories: 150,
          protein_g: 8,
          carbohydrates_total_g: 15,
          fat_total_g: 6,
        }
      }
    ];
  }
}
