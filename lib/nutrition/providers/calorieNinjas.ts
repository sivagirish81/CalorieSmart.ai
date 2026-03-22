import { NutritionProvider, ParsedFoodItem } from "../types";

export class CalorieNinjasProvider implements NutritionProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CALORIE_NINJAS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("CALORIE_NINJAS_API_KEY is not set in environment variables. API calls will fail.");
    }
  }

  async parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]> {
    if (!this.apiKey) {
      throw new Error("Missing CalorieNinjas API Key. Please add CALORIE_NINJAS_API_KEY to your .env file.");
    }

    const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`CalorieNinjas API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Safely map the returned data to our internal ParsedFoodItem interface
    return data.items.map((item: { name: string; calories: number; protein_g: number; carbohydrates_total_g: number; fat_total_g: number; serving_size_g: number; sugar_g: number; fiber_g: number; sodium_mg: number; cholesterol_mg: number }): ParsedFoodItem => ({
      name: item.name,
      serving_size_g: item.serving_size_g,
      nutrition: {
        calories: item.calories,
        protein_g: item.protein_g,
        carbohydrates_total_g: item.carbohydrates_total_g,
        fat_total_g: item.fat_total_g,
        sugar_g: item.sugar_g,
        fiber_g: item.fiber_g,
        sodium_mg: item.sodium_mg,
        cholesterol_mg: item.cholesterol_mg,
      }
    }));
  }
}
