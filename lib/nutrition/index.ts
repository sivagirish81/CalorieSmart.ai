import { NutritionProvider } from "./types";
import { MockNutritionProvider } from "./providers/mock";
import { CalorieNinjasProvider } from "./providers/calorieNinjas";
import { LocalSqliteProvider } from "./providers/localSqlite";
import { HybridNutritionProvider } from "./providers/hybrid";

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
