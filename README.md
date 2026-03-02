# CalorieSmart AI 🥗

A mobile-first web application for nutrition tracking with AI-powered food search, meal logging, and personalized dietary insights.

## 🚀 Features (Planned)
- **AI Food Search**: Natural language processing for food queries.
- **Meal Logging**: Easy tracking of daily meals.
- **Dynamic Dashboard**: Real-time progress tracking.
- **Dietary Suggestions**: AI-driven suggestions based on remaining calories and dietary preferences.
- **7-Day History**: Historical view of nutrition data.

## 🛠 Tech Stack
- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS
- **Database**: SQLite + Prisma ORM
- **Auth**: NextAuth.js / Custom JWT
- **AI/Nutrition**: Nutritionix / Edamam API (with mock fallback)

## 📦 Setup Instructions

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   NUTRITION_API_KEY="your_api_key_here" # Optional for Phase 1-2
   ```
4. **Initialize Database** (Available from Phase 2):
   ```bash
   npx prisma migrate dev
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🏗 Development Phases

### Phase 1: App Skeleton + Mock Dashboard (Current)
- [x] Next.js + Tailwind initialization
- [x] Dashboard UI with mocked data
- [x] Search page UI (Mock)
- [x] Mobile-first layout with navigation

### Phase 2: Authentication + Dietary Profile (Next)
- [ ] User registration/login
- [ ] Prisma schema and user profile
- [ ] Onboarding flow for dietary preferences

### Phase 3: AI Food Search
- [ ] Integration with Nutrition API
- [ ] Mock provider fallback
- [ ] Natural language parsing

### Phase 4: Meal Aggregator
- [ ] Persisting meals to database
- [ ] Real-time dashboard updates

### Phase 5: Meal Suggestions Engine
- [ ] "What should I eat?" recommendation logic
- [ ] Dietary-compliant suggestions

### Phase 6: History & Hardening
- [ ] 7-day history view
- [ ] Performance optimizations & caching

## 🎬 Demo Walkthrough (Phase 1)
1. Navigate to `/` to see the **Calorie Dashboard**.
2. Observe the progress bar and caloric breakdown (mocked).
3. Check the mobile-first navigation at the bottom.
4. Navigate to `/search` to see the meal logging interface.
