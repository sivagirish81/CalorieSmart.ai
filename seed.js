const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Helper to generate past dates
  const getDaysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // User 1: Demo Omnivore (Streak achieved)
  const user1 = await prisma.user.upsert({
    where: { email: 'demo1@example.com' },
    update: {},
    create: {
      email: 'demo1@example.com',
      password: password,
      name: 'Alex (Omnivore)',
      calorieBound: 2200,
      dietaryPreference: 'Omnivore',
      onboardingComplete: true,
    },
  });

  // User 2: Demo Vegan (Streak broken, random data)
  const user2 = await prisma.user.upsert({
    where: { email: 'demo2@example.com' },
    update: {},
    create: {
      email: 'demo2@example.com',
      password: password,
      name: 'Sam (Vegan)',
      calorieBound: 1900,
      dietaryPreference: 'Vegan',
      onboardingComplete: true,
    },
  });

  // Clear existing meal logs for these demo users
  await prisma.mealLog.deleteMany({
    where: { userId: { in: [user1.id, user2.id] } }
  });
  await prisma.customFood.deleteMany({
    where: { userId: { in: [user1.id, user2.id] } }
  });

  // Seed User 1 (Demo 1): Perfect 7 day streak (2200-2500 calories everyday)
  // Streak bounds: 2200 to 2500
  for (let i = 0; i <= 6; i++) {
    const logDate = getDaysAgo(i);
    logDate.setHours(12, 0, 0, 0); // Noon

    await prisma.mealLog.create({
      data: {
        userId: user1.id,
        type: 'Lunch',
        date: logDate,
        items: {
          create: [
            { name: 'Grilled Chicken Breast', calories: 600, protein: 50, carbs: 0, fat: 10 },
            { name: 'Rice', calories: 400, protein: 10, carbs: 80, fat: 2 },
            { name: 'Vegetable Salad', calories: 200, protein: 5, carbs: 10, fat: 15 },
          ]
        }
      }
    });

    const dinnerDate = getDaysAgo(i);
    dinnerDate.setHours(19, 0, 0, 0); // 7 PM Dinner
    // For today (i=0), don't add dinner by default yet so user can test the suggestion "We noticed you haven't logged much"
    // Actually I'll do dinner if i>0 so streaks make sense. For i=0, we only added 1200 kcal. Streak logic ignores today if today is incomplete.
    let dinnerCalories = 800; // Total 2000. Wait, user needs 2200. I'll add 1050 kcal.
    
    // For today (i=0), let's skip dinner so they are at 1200 / 2200, ripe for a suggestion!
    if (i > 0) {
        await prisma.mealLog.create({
          data: {
            userId: user1.id,
            type: 'Dinner',
            date: dinnerDate,
            items: {
              create: [
                { name: 'Steak', calories: 800, protein: 60, carbs: 0, fat: 50 },
                { name: 'Mashed Potatoes', calories: 250, protein: 5, carbs: 40, fat: 10 }, 
              ]
            }
          }
        });
    }
  }

  // Seed User 2 (Demo 2): Vegan variations, missed a day, overshot another
  for (let i = 0; i <= 6; i++) {
    if (i === 2) continue; // Missed logging 2 days ago

    const logDate = getDaysAgo(i);
    logDate.setHours(9, 0, 0, 0); 
    
    let dinnerCalories = 800;
    if (i === 1) dinnerCalories = 1500; // Overshot yesterday

    // For today, let's leave it completely blank!
    if (i === 0) continue; 

    await prisma.mealLog.create({
      data: {
        userId: user2.id,
        type: 'Breakfast',
        date: logDate,
        items: {
          create: [
            { name: 'Oatmeal & Berries', calories: 350, protein: 10, carbs: 60, fat: 5 },
            { name: 'Almond Milk', calories: 50, protein: 2, carbs: 3, fat: 3 },
          ]
        }
      }
    });

    const dinnerDate = getDaysAgo(i);
    dinnerDate.setHours(19, 0, 0, 0);
    await prisma.mealLog.create({
      data: {
        userId: user2.id,
        type: 'Dinner',
        date: dinnerDate,
        items: {
          create: [
            { name: 'Tofu Stir-fry', calories: dinnerCalories, protein: 30, carbs: 50, fat: 25 },
          ]
        }
      }
    });
  }

  // Custom Foods for Suggestions testing
  await prisma.customFood.create({
    data: { userId: user1.id, name: 'Mom’s Lasagna', calories: 500, protein: 25, carbs: 40, fat: 20 }
  });
  await prisma.customFood.create({
    data: { userId: user1.id, name: 'Quick Protein Shake', calories: 150, protein: 30, carbs: 5, fat: 2 }
  });
  await prisma.customFood.create({
    data: { userId: user2.id, name: 'Vegan Protein Bar', calories: 220, protein: 15, carbs: 25, fat: 8 }
  });
  await prisma.customFood.create({
    data: { userId: user2.id, name: 'Matcha Latte', calories: 120, protein: 3, carbs: 15, fat: 5 }
  });

  console.log('--- TEST DATA SEEDED ---');
  console.log('User 1 (Streak Achieved, Ready for PM Suggestion): demo1@example.com / password123');
  console.log('User 2 (Broken Streak, Blank Today): demo2@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
