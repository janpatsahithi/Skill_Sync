# Data Storage Audit – What’s in the DB vs localStorage

This document lists **what data is shown in the app** and **where it is stored**: **database (API)** or **localStorage only**.

---

## Stored in the **database** (persistent, synced)

These are loaded from the API and saved in MongoDB.

| What you see | Where it’s stored | API / Collection |
|--------------|-------------------|-------------------|
| **Dashboard – Goals count** | Database | `planningAPI.getGoals()` → `goals` |
| **Dashboard – Pending tasks count** | Database | `planningAPI.getTasks()` → `tasks` |
| **Dashboard – Saved resources count** | Database | `resourcesAPI.getResources()` → `resources` |
| **Dashboard – Resume history (list)** | Database | `resumeAPI.getResumes()` → `resumes` |
| **Dashboard – Quick actions / System overview** | Static UI | Not stored |
| **Goals & tasks (Planning)** | Database | `planningAPI` → `goals`, `tasks` |
| **Community posts & comments** | Database | `communityAPI` → `posts`, `comments` |
| **Projects** | Database | `projectsAPI` (community posts) → `posts` |
| **Resources (library)** | Database | `resourcesAPI` → `resources` |
| **Profile (background, interests, goals, preferences)** | Database | `userContextAPI` → `user_context` |
| **Settings (profile, notifications, privacy)** | Database | `userContextAPI.update()` → `user_context.preferences` |
| **Resume uploads (filenames, dates, skills count)** | Database | `resumeAPI` → `resumes` |
| **Feedback / Analytics** | Database | `feedbackAPI` → `feedback` |
| **Messaging (conversations)** | Database | `messagingAPI` (community) → `posts`, `comments` |

So: **all “real” app data you display (goals, tasks, resources, resumes, profile, community, feedback, etc.) is stored in the database**, not only in the browser.

---

## Stored in **localStorage** (cache / auth only)

Used only for **auth** and **optional cache**. The **source of truth is the database**.

| Key | Purpose | Used by |
|-----|--------|--------|
| `token` | JWT for API auth | `api.js` (Bearer), `AuthContext` |
| `user` | Logged-in user (id, name, email) | `AuthContext` – mirrors API login |
| `extracted_skills` | Cache of current user skills (synced from DB) | `SkillContext` – DB is primary via `GET /skills/me` |
| `skill_gap_result` | Cache of last skill-gap (synced to DB in `user_context.last_skill_gap`) | LearningPath – DB primary |
| `onboarding_completed` | Cache after DB write | Onboarding, ProtectedRoute – **onboarding status comes from API** |
| `onboarding_data` | Cache after DB write | Onboarding – **also stored in DB** (`user_context`) |

So: **auth tokens** and **optional cache** stay in localStorage; **all user content** (skills, onboarding, skill-gap result, goals, resources, etc.) is stored in the database.

---

## Important detail: **extracted skills**

- **Database:** Skills are stored in `user_skills` (on extract and on resume upload). The app loads them via `GET /skills/me` and uses localStorage only as cache.
- **Resume list and metadata** → **database** (`resumes`).
- **Skills list** → **database** (`user_skills`); **localStorage** is a cache only.

---

## Summary table

| Data | Database | localStorage |
|------|----------|--------------|
| User account (name, email, hashed password) | ✅ `users` | ❌ Only token + user copy for auth |
| Profile & context (background, interests, goals, preferences) | ✅ `user_context` | ❌ |
| Goals & tasks | ✅ `goals`, `tasks` | ❌ |
| Resumes (list + metadata) | ✅ `resumes` | ❌ |
| Extracted skills | ✅ `user_skills` | ✅ Cache in `extracted_skills` |
| Community posts & comments | ✅ `posts`, `comments` | ❌ |
| Resources | ✅ `resources` | ❌ |
| Feedback | ✅ `feedback` | ❌ |
| Onboarding completed & form data | ✅ `user_context` | ✅ Cache |
| Last skill-gap result | ✅ `user_context.last_skill_gap` | ✅ Cache |
| Auth token & user snapshot | ❌ | ✅ `token`, `user` (required for auth) |

---

## Direct answer to “Is every data I am displaying stored somewhere or in local storage?”

- **Almost everything you display** (dashboard stats, resume history, goals, tasks, resources, profile, community, feedback, etc.) **is stored in the database** and loaded via the API.
- **localStorage** is used for:
  - **Auth:** token and user snapshot.
  - **Convenience/cache:** last extracted skills, last skill-gap result, onboarding state (and optionally onboarding form data).

So: **yes, the data you display is stored “somewhere”** – most of it in the **database**; a small part only in **localStorage** as cache or session data.

If you want, we can next:
- Add an API call to load skills from `user_skills` so Skills/ExtractedSkills can show DB data when localStorage is empty (e.g. new device), or
- Add saving of onboarding data to `user_context` so it’s in the DB too.
