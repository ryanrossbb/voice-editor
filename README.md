# Voice Editor — v3

A lightweight CMS layer where a subject matter expert (Matt) signs in, sees what drafts need review and what's coming up next, and revises drafts by **speaking** their feedback into the browser.

## What's new in v3

- **Login wall** powered by Supabase. Email + password. Accounts created manually.
- **"Coming Up" pipeline panel** on the dashboard, populated from a published Google Sheet
- **Single-page workspace**: drafts that need review on top, upcoming topics below

---

## Upgrading from v2

If you already have v2 deployed:

1. Replace your project files with the contents of this folder. Keep your `.env.local` and `.git` folder.
2. Run `npm install` to pull in the new dependencies (`@supabase/ssr`, `@supabase/supabase-js`, `papaparse`).
3. Add the new env vars (Supabase + Google Sheet) — locally **and** on Netlify.
4. Commit and push. Netlify will redeploy.

```bash
git add .
git commit -m "v3: login + pipeline panel"
git push
```

---

## Setting up Supabase (~10 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is fine).
2. Click **New project**. Give it a name, set a database password (write it down — you won't need it for this app, but Supabase requires one), pick a region close to you, click Create.
3. Wait ~60 seconds for the project to spin up.
4. In the project dashboard, go to **Project Settings → API**.
5. Copy two values into your env vars:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Disable public signups (important!)

By default Supabase lets anyone sign up. Since only you and Matt should have accounts, turn signups off:

1. **Authentication → Sign In / Up** (sidebar)
2. Toggle **Allow new users to sign up** to OFF
3. Save

### Create accounts for you and Matt

1. **Authentication → Users** (sidebar)
2. Click **Add user → Create new user**
3. Fill in email + password
4. **Check the "Auto Confirm User" box** so you don't have to verify the email
5. Click Create
6. Repeat for Matt

You're done with Supabase setup. The app will redirect any visitor to `/login` and only let in users you've manually added.

---

## Setting up the Google Sheet (~2 minutes)

### Create the sheet

In a new Google Sheet, the first row should be these headers (in any order — the app finds them by name):

| Column           | What it's for                                            | Required? |
| ---------------- | -------------------------------------------------------- | --------- |
| `Title`          | Working title for the article                            | Yes       |
| `Keyword`        | Primary SEO keyword you're targeting                     | No        |
| `Target Date`    | When you plan to publish (any parseable date format)     | No        |
| `Status`         | Idea / Researching / Drafting / Ready for Matt / Scheduled / Published | No |
| `Notes`          | Angle, audience, special instructions                    | No        |
| `Search Volume`  | Monthly searches for the keyword                         | No        |
| `Search Intent`  | Informational / commercial / navigational                | No        |

Any row without a Title is skipped, so you can leave blank rows for spacing.

**Status colors on the dashboard:**
- `Idea` → grey
- `Researching` → blue
- `Drafting` → orange
- `Ready for Matt` or `Ready for Review` → red (calls attention)
- `Scheduled` or `Published` → green
- Anything else → neutral grey

### Publish the sheet as CSV

1. In your sheet: **File → Share → Publish to web**
2. Under **Link**, pick the tab you want (or "Entire Document")
3. Change the format from "Web page" to **Comma-separated values (.csv)**
4. Click **Publish**, confirm
5. Copy the URL it gives you (it'll look like `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`)
6. Paste that into `GOOGLE_SHEET_CSV_URL` in your env vars

**Note on privacy:** Published CSVs are accessible to anyone with the URL. The URL is long and obscure, but treat it as semi-public. Don't put client confidential info in the sheet.

The published version updates automatically within a minute or two of any edit you make to the source sheet.

---

## Local setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local — fill in your values
npm run dev
```

Visit http://localhost:3000. You'll be redirected to `/login`. Sign in with one of the accounts you created in Supabase.

If you haven't set up Supabase yet, leave `NEXT_PUBLIC_SUPABASE_URL` blank and the login wall is disabled (everything is public). Set it up when you're ready.

---

## Deploy to Netlify

In the Netlify dashboard for your site, **Site configuration → Environment variables**. Add all of these (mirror what's in your `.env.local`):

- `ANTHROPIC_API_KEY`
- `WP_SITE_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_SHEET_CSV_URL`

Then **Deploys → Trigger deploy → Deploy site**.

---

## URL routes

| Route          | What it does                                                  |
| -------------- | ------------------------------------------------------------- |
| `/`            | Dashboard — drafts needing review + upcoming topics           |
| `/login`       | Login form (Supabase email + password)                        |
| `/edit/[id]`   | Voice editor for a specific WordPress post                    |
| `/standalone`  | Original paste-a-draft flow with shareable links              |
| `/api/wp/*`    | (internal) WordPress integration                              |
| `/api/pipeline` | (internal) Returns sheet rows                                |
| `/api/auth/signout` | (internal) Clears session                                |
| `/api/revise`  | (internal) Sends draft + transcript to Claude                 |

Everything except `/login` and `/api/auth/*` requires login (when Supabase is configured).

---

## Notes & tradeoffs

- **Account recovery**: there's no "forgot password" flow built in yet. If Matt forgets his password, reset it via Supabase dashboard → Users → click his row → Reset password.
- **Adding users later**: Authentication → Users → Add user. Make sure "Allow new users to sign up" stays disabled.
- **Pipeline cache**: each dashboard load fetches the sheet fresh. If the sheet doesn't update within ~60 seconds after you edit it, that's Google's publishing delay, not the app's.
- **Single reviewer name**: the dashboard says "Matt Simon's Workspace". Edit `app/page.jsx` to change.

---

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) for auth
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) for icons
- [turndown](https://github.com/mixmark-io/turndown) for HTML → Markdown
- [marked](https://marked.js.org/) for Markdown → HTML
- [papaparse](https://www.papaparse.com/) for CSV parsing
- WordPress REST API + Application Passwords
- Anthropic API (Claude Sonnet 4.6)
