import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const foods = [
  // --- Common Western Foods ---
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

  // --- Indian Dishes (per standard serving) ---
  { name: "mutton biryani", calories: 490, protein_g: 28, carbohydrates_total_g: 52, fat_total_g: 18, serving_size_g: 350 },
  { name: "mutton ghee roast biryani", calories: 580, protein_g: 30, carbohydrates_total_g: 50, fat_total_g: 24, serving_size_g: 380 },
  { name: "chicken biryani", calories: 430, protein_g: 27, carbohydrates_total_g: 50, fat_total_g: 14, serving_size_g: 350 },
  { name: "vegetable biryani", calories: 310, protein_g: 8, carbohydrates_total_g: 55, fat_total_g: 8, serving_size_g: 300 },
  { name: "butter chicken", calories: 290, protein_g: 25, carbohydrates_total_g: 12, fat_total_g: 16, serving_size_g: 250 },
  { name: "dal makhani", calories: 198, protein_g: 9, carbohydrates_total_g: 22, fat_total_g: 8, serving_size_g: 200 },
  { name: "paneer tikka masala", calories: 340, protein_g: 18, carbohydrates_total_g: 15, fat_total_g: 22, serving_size_g: 250 },
  { name: "naan", calories: 262, protein_g: 8.7, carbohydrates_total_g: 45, fat_total_g: 5.1, serving_size_g: 90 },
  { name: "roti", calories: 120, protein_g: 3.5, carbohydrates_total_g: 22, fat_total_g: 2.5, serving_size_g: 60 },
  { name: "samosa", calories: 262, protein_g: 5, carbohydrates_total_g: 30, fat_total_g: 13, serving_size_g: 100 },
  { name: "gulab jamun", calories: 150, protein_g: 2, carbohydrates_total_g: 20, fat_total_g: 7, serving_size_g: 50 },
  { name: "rasgulla", calories: 106, protein_g: 2.6, carbohydrates_total_g: 22, fat_total_g: 1, serving_size_g: 60 },
  { name: "idli", calories: 58, protein_g: 2, carbohydrates_total_g: 11.5, fat_total_g: 0.4, serving_size_g: 50 },
  { name: "dosa", calories: 168, protein_g: 4, carbohydrates_total_g: 30, fat_total_g: 4, serving_size_g: 100 },
  { name: "masala dosa", calories: 210, protein_g: 5, carbohydrates_total_g: 36, fat_total_g: 6, serving_size_g: 130 },
  { name: "chole bhature", calories: 480, protein_g: 14, carbohydrates_total_g: 62, fat_total_g: 20, serving_size_g: 300 },
  { name: "rajma rice", calories: 380, protein_g: 14, carbohydrates_total_g: 64, fat_total_g: 8, serving_size_g: 350 },
  { name: "palak paneer", calories: 240, protein_g: 12, carbohydrates_total_g: 12, fat_total_g: 16, serving_size_g: 200 },
  { name: "mango lassi", calories: 180, protein_g: 5, carbohydrates_total_g: 32, fat_total_g: 4, serving_size_g: 250 },
  { name: "chai", calories: 60, protein_g: 2, carbohydrates_total_g: 9, fat_total_g: 2, serving_size_g: 150 },
  { name: "coke", calories: 39, protein_g: 0, carbohydrates_total_g: 10.6, fat_total_g: 0, serving_size_g: 100 },
  { name: "coca cola", calories: 39, protein_g: 0, carbohydrates_total_g: 10.6, fat_total_g: 0, serving_size_g: 100 },
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
