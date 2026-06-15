# 🛠️ System Specification: House Decoration Contest Portal (Taleon - San)

**Target:** AI Developer / Software Engineer LLM  
**Context:** This document acts as a comprehensive prompt and specification sheet to build a automated web platform for a Tibia House Decoration Contest on the server **Taleon - San**, organized by **The Crusty**.

---

## 🎯 Project Overview
Build a lightweight, highly dynamic, responsive web application for managing contest registrations, character validations, public voting (Tinder-style interface), and a real-time gamified leaderboard.

---

## 🧱 Architectural & Technical Constraints

### 1. Authentication (Discord OAuth2 Integration)
* **Rule:** Users cannot register a house or vote without authenticating through Discord.
* **OAuth Setup Steps for AI:**
  1. Create a Discord Developer Application.
  2. Configure OAuth2 redirect URIs.
  3. Implement login flow using `discord` scope `identify`.
  4. Securely extract and store the user's `Discord ID` in the database to manage session persistence and strictly prevent duplicate voting or registrations.

### 2. Character Validation Engine (Web Scraping / HTTP Verification)
* **Target Endpoint:** `https://san.taleon.online/characterprofile.php?name=[CHAR]`
* **Workflow:**
  1. Input Character Name.
  2. Fire HTTP request replacing `[CHAR]` with URL-encoded input.
  3. If the page returns a standard error template or "Character does not exist", flag as **Invalid** and block action.

---

## 👥 User Flows & Feature Requirements

### A. Homepage (Pre-Voting / Registration Phase)
* **Hero Section Carousel:** Display a visually appealing, auto-rotating carousel of houses that have already registered. Show their screenshots, house name, and city to build hype.
* **Phase Lock:** The system must strictly separate phases. Voting logic/buttons must be locked and hidden while the Registration phase is active.

### B. House Registration Flow
1. **Prerequisites:** User logged in via Discord. Registration phase active.
2. **Form Inputs:**
   * **Character Name** (Validated via Endpoint).
   * **House Name** & **City Location**.
   * **Selected Floor** (Dropdown/Text).
   * **Theme** (Optional field).
   * **Quantity of Exercise Dummies:** (Integer input).
   * **Quantity of Hirelings (NPCs):** (Integer input).
   * **Screenshots Upload:** Support for image URLs.
3. **Database Constraint:** One Discord Account / Valid Character can register exactly **one** house.

### C. Voting Flow & Rules (Tinder-Style Swiping)
1. **Prerequisites:** Registration phase has officially ended. Voting phase is active. User logged in via Discord.
2. **Input Requirement:** The voter must type their own valid character name from Taleon - San.
3. **UI Interaction (Tinder-Style):**
   * Instead of a grid, present one house at a time in a card format.
   * Users can swipe left (or click "Dislike") and swipe right (or click "Match").
4. **Voting Rules & Flexibility:**
   * A user can evaluate an unlimited number of houses.
   * A user can only have one active vote (Match or Dislike) per house.
   * **Vote Updating:** A user must be able to change their vote for any house at any point during the voting phase (Implement `UPSERT` logic in the database for `vote_type`).
5. **Deep Linking:** Every registered house must generate a unique shareable permanent link (e.g., `/house/[id]`) that opens the Tinder-style card directly for that specific house.

### D. Real-Time Gamified Leaderboard
* **Dynamic Score Calculator Formula:**
  $$	ext{Total Points} = \left(rac{	ext{Total Matches}}{5}ight) + (	ext{Organizer Votes} 	imes 2) + 	ext{Utility Bonus}$$
* **Utility Bonus Calculation Logic:**
  * System dynamically sums `Quantity of Dummies` + `Quantity of Hirelings`.
  * Highest sum gets `+2` score modifier. Second-highest gets `+1` score modifier.
* **Prize Pool Calculator UI:** * Display the dynamic prize pool based on the number of registrations (Base Prize + Registration Fees [1KK per entry]).
  * Calculate live payouts: 1st (30KK + 50% fees), 2nd (20KK + 35% fees), 3rd (10KK + 15% fees).

---

## 🚀 Deployment, Database & Infrastructure

### 1. Database Creation (Supabase)
* **Setup Instructions for AI:**
  1. Initialize a Supabase project.
  2. Define SQL schema for tables: 
     * `users` (Discord ID mapping, Validated Character Name).
     * `houses` (Registration details, Dummies/Hirelings count).
     * `votes` (Columns: `discord_user_id`, `house_id`, `vote_type` [boolean or enum for Match/Dislike]). **Crucial:** Create a Unique Constraint on `(discord_user_id, house_id)` to allow seamless `UPSERT` operations when a user changes their vote.
  3. Set up Row Level Security (RLS) to ensure users can only cast/modify their own votes.
  4. Create views or edge functions to calculate the leaderboard dynamically.

### 2. GitHub Pages Deployment Steps
* **Deployment Workflow:**
  1. Configure the frontend framework (e.g., React/Vite or Next.js using `next export`) to output a static build.
  2. Ensure routing handles Client-Side Rendering appropriately (e.g., hash routing or custom `404.html` redirect trick for single-page applications).
  3. Provide a GitHub Actions YAML workflow script (`.github/workflows/deploy.yml`) to automatically build and deploy the application to the `gh-pages` branch upon pushing to `main`.
  4. Ensure environment variables (Supabase URL/Anon Key, Discord Client ID) are configured as GitHub Repository Secrets and injected during the build step.
