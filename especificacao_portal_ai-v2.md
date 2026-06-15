# 🛠️ System Specification: House Decoration Contest Portal (Taleon - San)

**Target:** AI Developer / Software Engineer LLM  
**Context:** This document acts as a comprehensive prompt and specification sheet to build a automated web platform for a Tibia House Decoration Contest on the server **Taleon - San**, organized by **The Crusty**.

---

## 🎯 Project Overview
Build a lightweight, highly dynamic, responsive web application for managing contest registrations, character validations, public voting, and a real-time gamified leaderboard.

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

### A. House Registration Flow
1. **Prerequisites:** User logged in via Discord.
2. **Form Inputs:**
   * **Character Name** (Validated via Endpoint).
   * **House Name** & **City Location**.
   * **Selected Floor** (Dropdown/Text).
   * **Theme** (Optional field).
   * **Quantity of Exercise Dummies:** (Integer input - explicitly separate from Hirelings).
   * **Quantity of Hirelings (NPCs):** (Integer input - explicitly separate from Dummies).
   * **Screenshots Upload:** Support for image URLs.
3. **Database Constraint:** One Discord Account / Valid Character can register exactly **one** house.

### B. Voting Flow & Rules
1. **Prerequisites:** User logged in via Discord.
2. **Input Requirement:** The voter must type their own valid character name from Taleon - San.
3. **Voting Limit:** A maximum of **2 votes total** per Discord Account.
4. **Deep Linking:** Every registered house must generate a unique shareable permanent link (e.g., `/house/[id]`).

### C. Real-Time Gamified Leaderboard
* **Dynamic Score Calculator Formula:**
  $$	ext{Total Points} = \left(rac{	ext{Popular Votes}}{5}ight) + (	ext{Organizer Votes} 	imes 2) + 	ext{Utility Bonus}$$
* **Utility Bonus Calculation Logic:**
  * System dynamically sums `Quantity of Dummies` + `Quantity of Hirelings`.
  * Highest sum gets `+2` score modifier. Second-highest gets `+1` score modifier.
* **Prize Pool Calculator UI:** * Display the dynamic prize pool based on the number of registrations (Base Prize + Registration Fees [1KK per entry]).
  * Calculate live payouts: 1st (30KK + 50% fees), 2nd (20KK + 35% fees), 3rd (10KK + 15% fees).

---

## 🚀 Deployment, Database & Infrastructure

### 1. Database Creation (Supabase)
* **Setup Instructions for AI:**
  1. Initialize a Supabase (or Supacel) project.
  2. Define SQL schema for tables: `users` (Discord ID mapping), `houses` (Registration details, Dummies/Hirelings count), and `votes` (Tracking who voted for whom to enforce the 2-vote limit).
  3. Set up Row Level Security (RLS) to ensure users can only cast votes if they haven't exceeded their limit.
  4. Create views or edge functions to calculate the leaderboard dynamically.

### 2. GitHub Pages Deployment Steps
* **Deployment Workflow:**
  1. Since GitHub Pages serves static files, configure the frontend framework (e.g., React/Vite or Next.js using `next export`) to output a static build (`out` or `dist` directory).
  2. Ensure routing handles Client-Side Rendering appropriately (e.g., hash routing or custom `404.html` redirect trick for single-page applications).
  3. Provide a GitHub Actions YAML workflow script (`.github/workflows/deploy.yml`) to automatically build and deploy the application to the `gh-pages` branch upon pushing to `main`.
  4. Ensure environment variables (Supabase URL/Anon Key, Discord Client ID) are configured as GitHub Repository Secrets and injected during the build step.
