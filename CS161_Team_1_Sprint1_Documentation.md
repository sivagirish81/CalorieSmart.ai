# Status Report - Sprint #1

**Team #:** [Insert Team Number]
**Team Name:** CalorieSmart AI
**Team Members:** Siva Girish Ramesh, Kranthi Kusal Latchupathula
**Class:** CS161
**Date:** March 15, 2026

***

### 1. Product Backlog
**Live Tracker URL:** [Insert Shared Google Sheets or Notion Link Here]
*Note: A physical snapshot of our product backlog tracking matrix has also been submitted alongside this document as `CS161_Team_[x]_Sprint1_ProductBacklog.csv`.*

### 2. Sprint Retrospective: What Went Well
- **Architectural Velocity:** The core Next.js 15 Turbopack foundation compiled flawlessly out of the box. This allowed us to rapidly iterate on the UI component frames without fighting local server environments.
- **Provider Abstraction:** Engineering the `NutritionProvider` into a Strategy Pattern successfully proved our core Natural Language Processing (NLP) viability early on, without permanently locking us into a single expensive API vendor.
- **Data Modeling:** Integrating Prisma ORM heavily simplified our relational SQL mappings for the `User`, `MealLog`, and `FoodItem` entities. It guaranteed a strict TypeScript safety layer across the entire database.

### 3. Sprint Retrospective: Issues and Blockers
- **Rate Limiting:** We initially struggled to test effectively because the live CalorieNinjas API rapidly rate-limited our local environment queries. We aggressively resolved this by physically building a `MockNutritionProvider` which simulates the AI payload responses locally with a forced 500ms delay.
- **CI/CD Constraints:** When compiling our `.github/workflows/ci.yml` pipeline, the GitHub runner crashed instantly because it lacked our localized `.env` database parameters. We successfully mitigated this by injecting dummy environmental proxy configurations into the cloud matrix.

### 4. Sprint Execution: Finished vs Incomplete Tasks
**Completed Tasks (Sprint 1 Roadmap):**
- Setup standard Next.js App Router Repository with TailwindCSS.
- Initialized physical SQLite Relational Tables (`dev.db`).
- Engineered robust Abstract API Types (`ParsedFoodItem`).
- Successfully deployed both Live and Mock algorithmic internal Search mechanisms.

**Incomplete Tasks (Pushed to Sprint 2):**
- Full `NextAuth.js` Credentials Authentication architecture. *(We explicitly delayed this to prioritize core data structure stability first).*
- Physical deployment of the `/onboarding` dashboard interception routing.

### 5. Process Adjustments for Sprint 2
- **Stricter Typings:** We will aggressively enforce ESLint/TypeScript generic definitions upfront (actively replacing lazy `any` types with `unknown` Error boundaries) so our Production CI pipelines do not unexpectedly crash on `Exit Code 1`.
- **Insulated Logic:** We are formally mandating that all future database mutations occur entirely within Next.js **Server Actions** to permanently shield our internal API Keys from the client-side UI tree.

### 6. Scrum Meeting Log
Since the start of Sprint 1, our team has executed **5 formal Scrum Standups** averaging between 5 to 8 minutes each. 
*(Outside of class synchronization)*

| Date | Location | Duration | Attendance | Key Discussion Items |
| :--- | :--- | :--- | :--- | :--- |
| **Feb 23, 2026** | Virtual (Discord/Zoom) | 6 mins | 100% | Finalizing the backlog matrix and repository initialization. |
| **Feb 27, 2026** | Virtual (Discord/Zoom) | 5 mins | 100% | Prisma Database schema mapping execution and merge conflicts. |
| **Mar 04, 2026** | In-Person (CS Lab) | 8 mins | 100% | Drafting the Hybrid Provider constraint block for the NLP engine. |
| **Mar 09, 2026** | Virtual (Discord/Zoom) | 6 mins | 100% | Connecting local React state forms to the SQLite backend. |
| **Mar 14, 2026** | Virtual (Discord/Zoom) | 7 mins | 100% | Formatting GitHub PRs and debugging CI test build crashes. |
