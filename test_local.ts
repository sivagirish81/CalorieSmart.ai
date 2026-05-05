import { getNutritionProvider } from "./lib/nutrition";
import { prisma } from "./lib/db";

async function test() {
  const provider = getNutritionProvider();
  console.log("Using provider:", provider.constructor.name);
  
  console.log("\n--- TEST 1: Unknown Food (Should hit API and Cache it) ---");
  const result1 = await provider.parseNaturalLanguage("1 exotic dragonfruit");
  console.log(JSON.stringify(result1, null, 2));

  console.log("\n--- Let's verify it was saved in the DB ---");
  const dbItem = await prisma.localFoodDictionary.findFirst({ where: { name: { contains: "dragonfruit" } } });
  console.log("Found in DB:", dbItem?.name);

  console.log("\n--- TEST 2: Same Food (Should hit Local DB this time) ---");
  const result2 = await provider.parseNaturalLanguage("1 exotic dragonfruit");
  console.log(JSON.stringify(result2, null, 2));
}

test();
