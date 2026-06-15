# 🛠️ System Specification: House Decoration Contest Portal (Taleon - San)

**Target:** AI Developer / Software Engineer LLM  
**Context:** This document acts as a comprehensive prompt and specification sheet to build a automated web platform for a Tibia House Decoration Contest on the server **Taleon - San**, organized by **The Crusty**.

---

## 🎯 Project Overview
Build a lightweight, highly dynamic, responsive web application for managing contest registrations, character validations, public voting (Tinder-style interface), and a real-time gamified leaderboard.

Rules and Details of the event `C:\Users\admin\Documents\GitHub\TaleonConcursoHouses\regras_concurso-v5.md`

---

## 🧱 Architectural & Technical Constraints

### 1. Authentication (Discord OAuth2 Integration)
* **Rule:** Users cannot register a house or vote without authenticating through Discord.
* **OAuth Setup Steps for AI:**
  1. Create a Discord Developer Application.
  2. Configure OAuth2 redirect URIs.
  3. Implement login flow using `discord` scope `identify`.
  4. Securely extract and store the user's `Discord ID` in the database.

### 2. Character Validation Engine (Web Scraping / HTTP Verification)
* **Target Endpoint:** `https://san.taleon.online/characterprofile.php?name=[CHAR]`
* **Workflow:**
  1. Input Character Name.
  2. Fire HTTP request replacing `[CHAR]` with URL-encoded input.
  3. If the page returns a standard error template or "Character does not exist", flag as **Invalid** and block action.

---

## 👥 User Flows & Feature Requirements

### A. Phase Management System
The portal must explicitly handle three chronological phases:
1. **Registration Phase (15 Days):** Users can submit houses. Voting UI is locked. Homepage shows a carousel of currently submitted houses.
2. **Validation Phase (2 Days):** Registrations are closed. Voting UI is still locked. This buffer allows the admin to manually verify 10 Taleon Coins in-game fee payments and approve/reject entries.
3. **Voting Phase (15 Days):** Registration is closed. Tinder-style voting opens **only** for houses that were marked as `Approved` by the admin.

### B. House Registration Flow
1. **Prerequisites:** User logged in via Discord. Registration phase active.
2. **Form Inputs:**
   * **Character Name** (Validated via Endpoint).
   * **In-Game House Location:** (e.g., "Wood Avenue 1", "Venore").
   * **Selected Floor to be Evaluated** (Dropdown/Text).
   * **Custom House Name:** (String). Add a placeholder/helper text saying *"Batize sua obra! Use a criatividade!"*.
   * **Theme:** (String). Add a placeholder/helper text saying *"Qual a temática da sua decoração? Seja criativo!"*.
   * **Quantity of Exercise Dummies:** (Integer input).
   * **Quantity of Hirelings (NPCs):** (Integer input).
   * **Screenshots Upload:** Support for image URLs.
3. **Database Constraint:** One Discord Account / Valid Character can register exactly **one** house. Default submission status should be `Pending`.

### C. Voting Flow & Rules (Tinder-Style Swiping)
1. **Prerequisites:** Voting phase is active. User logged in via Discord.
2. **Input Requirement:** The voter must type their own valid character name from Taleon - San.
3. **Free Voting Enforcement:** Ensure the UI copy explicitly states that **voting is 100% free**. No payment checks should occur for voters.
4. **UI Interaction (Tinder-Style):**
   * Present one `Approved` house at a time in a card format.
   * Display the Custom House Name, Theme, Location, and Screenshots prominently.
   * Swipe left (Dislike) / Swipe right (Match).
5. **Voting Rules & Flexibility:**
   * User can evaluate an unlimited number of houses.
   * User can only have one active vote (Match or Dislike) per house.
   * **Vote Updating:** A user must be able to change their vote for any house at any point (Implement `UPSERT` logic).
6. **Deep Linking:** Generates `/house/[id]` for direct sharing.

### D. Real-Time Gamified Leaderboard
* **Dynamic Score Formula:** Total Points = (Total Matches / 5) + (Organizer Votes * 2) + Utility Bonus
* **Utility Bonus:** Highest sum of Dummies+Hirelings gets +2 points. Second gets +1.
* **Prize Pool Calculator UI:** Calculate live payouts based on approved registrations: 1st (30KK + 50% fees), 2nd (20KK + 35% fees), 3rd (10KK + 15% fees).

### E. Secure Admin Control Panel
A secure dashboard strictly restricted to specified Discord ID(s) (The Crusty).
* **Payment Validation Queue:** A dedicated table listing all `Pending` house registrations. The admin must be able to toggle the status of each entry to `Approved` (fee received) or `Rejected` (fee not received).
* **Control Actions:** Ability to cast Organizer Votes (+2 points), toggle the "Honorable Mention" badge, and audit Dummies/NPC counts.

---

## 🚀 Deployment, Database & Infrastructure

### 1. Database Creation (Supabase)
* **Setup Instructions for AI:**
  1. Initialize a Supabase project.
  2. Define SQL schema for tables: 
     * `users` (Discord ID, Validated Character Name).
     * `houses` (Registration details, Custom Name, Theme, Dummies/Hirelings count, `status` column [ENUM/String: 'pending', 'approved', 'rejected'] defaulting to 'pending').
     * `votes` (`discord_user_id`, `house_id`, `vote_type`). Create a Unique Constraint on `(discord_user_id, house_id)`.
  3. Set up Row Level Security (RLS).
  4. Create views or edge functions for the leaderboard.

### 2. GitHub Pages Deployment Steps
* **Deployment Workflow:**
  1. Configure frontend framework for static output.
  2. Ensure routing handles Client-Side Rendering properly.
  3. Provide a `.github/workflows/deploy.yml` to automatically build/deploy to `gh-pages` branch.
  4. Inject secrets (Supabase, Discord OAuth) during build step.
