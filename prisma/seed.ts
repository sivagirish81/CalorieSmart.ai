import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const foods = [
  { name: "egg", calories: 78, protein_g: 6.3, carbohydrates_total_g: 0.6, fat_total_g: 5.3, serving_size_g: 50 },
  { name: "toast", calories: 75, protein_g: 3.1, carbohydrates_total_g: 13.8, fat_total_g: 0.8, serving_size_g: 28 },
  { name: "apple", calories: 95, protein_g: 0.5, carbohydrates_total_g: 25.1, fat_total_g: 0.3, serving_size_g: 182 },
  { name: "banana", calories: 105, protein_g: 1.3, carbohydrates_total_g: 27, fat_total_g: 0.4, serving_size_g: 118 },
  { name: "chicken", calories: 239, protein_g: 27.3, carbohydrates_total_g: 0, fat_total_g: 13.6, serving_size_g: 100 },
  { name: "rice", calories: 130, protein_g: 2.7, carbohydrates_total_g: 28.2, fat_total_g: 0.3, serving_size_g: 100 },
  { name: "coffee", calories: 2, protein_g: 0.3, carbohydrates_total_g: 0, fat_total_g: 0, serving_size_g: 237 },
  { name: "salad", calories: 15, protein_g: 1.4, carbohydrates_total_g: 2.9, fat_total_g: 0.2, serving_size_g: 100 },
  { name: "pizza", calories: 285, protein_g: 12.2, carbohydrates_total_g: 35.7, fat_total_g: 10.4, serving_size_g: 107 },
  { name: "avocado", calories: 160, protein_g: 2, carbohydrates_total_g: 8.5, fat_total_g: 14.7, serving_size_g: 100 },
];

async function main() {
  console.log("Seeding LocalFoodDictionary...");
  
  for (const food of foods) {
    await prisma.localFoodDictionary.upsert({
      where: { name: food.name },
      update: {},
      create: food,
    });
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
