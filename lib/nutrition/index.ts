import { NutritionProvider } from "./types";
import { MockNutritionProvider } from "./providers/mock";
import { CalorieNinjasProvider } from "./providers/calorieNinjas";
import { LocalSqliteProvider } from "./providers/localSqlite";
import { HybridNutritionProvider } from "./providers/hybrid";

// Environment variable to determine which provider to use
// Potential values: "API" (Option A), "LOCAL" (Option B), or "MOCK" (Development)
const SOURCE = process.env.NUTRITION_SOURCE || "MOCK";

export function getNutritionProvider(): NutritionProvider {
  switch (SOURCE) {
    case "API":
      return new CalorieNinjasProvider();
    case "LOCAL":
      return new LocalSqliteProvider();
    case "HYBRID":
      return new HybridNutritionProvider();

    case "MOCK":
    default:
      return new MockNutritionProvider();
  }
}
