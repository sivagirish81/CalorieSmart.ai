# CalorieSmart AI 🥗

[![CI Status](https://img.shields.io/github/actions/workflow/status/sivagirish81/CalorieSmart.ai/ci.yml?branch=main&label=CI&logo=github&style=flat-square&color=blue)](https://github.com/sivagirish81/CalorieSmart.ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

**Precision Nutrition, Powered by Intelligence.**

CalorieSmart AI is a mobile-first, high-performance web application designed for frictionless natural-language nutrition tracking. Built with focus on user experience and data privacy, it transforms casual food descriptions into precise nutritional data using AI.

---

## ✨ Features

- **🔐 Secure Authentication**: Integrated NextAuth.js workflow with bcrypt-hashed password security and JWT session management.
- **🧠 AI Meal Analyzer**: Natural Language Processing (NLP) bridge via Server Actions to parse food descriptions into macros (Protein, Fats, Carbs).
- **📋 Intelligent Onboarding**: Profile-driven tracking that calculates personalized calorie limits and dietary requirements.
- **📊 Real-time Dashboard**: Dynamic telemetry visualization of your daily calorie progress and macro distribution.
- **� Reliable Persistence**: Powered by SQLite and Prisma ORM for end-to-end type safety and lightning-fast local data access.
- **📱 Mobile-First Design**: Highly responsive UI built for modern devices with fluid animations and micro-interactions.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [SQLite](https://sqlite.org/) via [Prisma ORM](https://www.prisma.io/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (Auth.js)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI/NLP**: Natural Language nutrition parsing (CalorieNinjas API Integration)

---

## 🚀 Getting Started

Follow these steps to get the application running on your local machine:

### 1. Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/sivagirish81/CalorieSmart.ai.git
cd CalorieSmart.ai
npm install
```

### 3. Environment Configuration
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Key configuration values needed:
- `NUTRITION_SOURCE`: Set to `"API"` for live results or `"MOCK"` for local testing.
- `CALORIE_NINJAS_API_KEY`: Required if using `API` source.
- `NEXTAUTH_SECRET`: A secure random string for session encryption.

### 4. Database Setup
Initialize the local SQLite database and sync the schema:
```bash
npx prisma db push
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to begin tracking your nutrition.

---

## 📖 How To Use

1. **Sign Up**: Create a secure account at `/signup`.
2. **Onboard**: Complete your biological profile (Calorie Goal, Name, Diet) to unlock the dashboard.
3. **Log Meals**: Use the **Log Meal (🔍)** action. Type naturally: *"a bowl of oatmeal with blueberries and a coffee"*.
4. **Track Progress**: Your dashboard instantly reflects the total macros and calories added to your daily log.

---

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
© 2026 CalorieSmart AI.
