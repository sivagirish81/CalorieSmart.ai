export interface NutritionalInfo {
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  sugar_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
}

export interface ParsedFoodItem {
  name: string;
  serving_size_g: number;
  nutrition: NutritionalInfo;
}

export interface NutritionProvider {
  /**
   * Parses a natural language query (e.g., "1 slice of pizza and a salad") 
   * and returns an array of broken down food items with their nutritional value.
   */
  parseNaturalLanguage(query: string): Promise<ParsedFoodItem[]>;
}
