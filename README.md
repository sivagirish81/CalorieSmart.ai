# CalorieSmart AI 🥗

**Precision Nutrition, Powered by Intelligence.**

This repository implements **Phase 1 and Phase 2** of the CalorieSmart AI Codex Build Prompt. It is a mobile-first, highly responsive web application designed for frictionless natural-language nutrition tracking.

---

## 🛠 Features Implemented (Post-Repo Pull)

Since cloning this base Next.js repository, the following core MVP architectural mechanisms have been rigorously developed and deployed to satisfy the Phase 1 & Phase 2 constraints:

### 1. NextAuth Credentials Authentication (Phase 2)
The application is no longer a localized mock. We strictly enforce multi-user, encrypted sessions:
- Implemented dedicated, animated `/login` and `/signup` gateway workflows.
- User passwords are cryptographically hashed using `bcryptjs`.
- HTTP-Only JWT tokens are managed natively by NextAuth (`auth.js`).

### 2. Physical Database & Prisma Tooling (Phase 2)
We decoupled static JSON mocks out of the UI tree and built physical persistence:
- Initialized a local file-based `SQLite` database (`dev.db`).
- Configured **Prisma ORM**, providing absolute end-to-end TypeScript safety.
- Created scalable, relational data models (`User`, `MealLog`, `FoodItem`).

### 3. Strict Onboarding Pipeline (Phase 2)
As requested by the master prompt, the database strictly tracks profile completion (`onboardingComplete = false` default constraint). 
- If a user mathematically authenticates but has zero biological metadata, the Server Component inside `app/page.tsx` forcibly intercepts the rendering tree and redirects them to the dedicated `/onboarding` UI.
- Here they must provide their Calorie Limit and Dietary Preference before the Dashboard unlocks.

### 4. Hybrid AI Meal Analyzer (Phase 1 & Phase 3)
- Implemented a Natural Language Processing strategy via Next.js **Server Actions**. This strictly prevents the external API keys from leaking to the browser client.
- We support a `MOCK` provider constraint to achieve "sub-2-second" responses offline, but can seamlessly swap to instant live payloads using the `API` provider (CalorieNinjas).

---

## 📖 How To Use These Features

### 1. Boot up the Live Data Setup
Ensure your `.env` file in the root of the project is correctly defined:
```env
# "API" engages CalorieNinjas. "MOCK" uses local offline test responses.
NUTRITION_SOURCE="API" 
CALORIE_NINJAS_API_KEY="your_api_key_here"

# Standard SQLite and Auth bindings
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_random_string"
```
Run `npx prisma db push` to generate your local `dev.db` identical copy. Then execute `npm run dev`.

### 2. Using Authentication & Onboarding
- **Sign Up**: Navigate to `http://localhost:3000/signup`. Enter an email/password. The database securely registers you.
- **Onboard**: Upon successful signup, the application strictly forces you to the `/onboarding` page. Input your biological profile (Calorie Goal, Name, Diet).
- **Dashboard Synchronization**: Once submitted, the Server Action (`submitOnboarding`) flips your database flag to `true`, unlocking the root dashboard exclusively.

### 3. AI Food Searching & Dashboard Telemetry
- Click the **Log Meal (Magnifying Glass)** quick action on the dashboard.
- Type *"a slice of pepperoni pizza and a salad"*.
- The Server Actions immediately capture the query, dispatch it to the API, and calculate the exact macro level (Protein, Fats, Carbs).
- Click **"Add to Daily Log"**. This transaction is securely tied strictly to your `User ID` and pushes the data to the SQLite `FoodItem` table. 
- Return home: Your Dashboard physically aggregates your entries and draws a dynamic progress bar tracking your calorie proximity.

---
© 2026 CalorieSmart AI.
