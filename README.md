# Voice Editor — v2

A lightweight CMS layer for a subject matter expert (e.g. Matt Simon) to review WordPress drafts **by speaking** their feedback. Matt opens the dashboard, picks a draft, talks into the mic, watches Claude revise it, accepts the changes, and saves back to WordPress in one click.

## What's new in v2

- **WordPress drafts dashboard at `/`** — pulls draft, pending, private, and scheduled posts via the WP REST API
- **Edit-in-place at `/edit/[id]`** — voice editor loads the post, saves back when Matt's done
- **Markdown round-trip** — headings, bold, italics, lists, and links survive the editing loop
- **Title editing** — Matt can also revise headlines
- **Original paste-a-draft flow still lives at `/standalone`** — useful for content not in WordPress yet

---

## Upgrading from v1

If you already have v1 deployed:

1. **Replace your project files** with everything in this folder. Keep your existing `.env.local` and `.git` folder — don't overwrite those.
2. **Add the new env vars** to `.env.local` (and to your Netlify environment variables): `WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`.
3. **Install the new dependencies**: `npm install` (this will add `turndown` and `marked`).
4. **Commit and push** — Netlify will auto-deploy.

```bash
git add .
git commit -m "v2: WordPress dashboard + save-back"
git push
```

---

## Setting up WordPress access

1. Log into the WordPress admin of the site you want to connect.
2. Go to **Users → Profile** (or **Users → All Users → Edit** for a specific user).
3. Scroll to **Application Passwords**.
4. Enter a name like "Voice Editor", click **Add New Application Password**.
5. WordPress shows you a string like `abcd 1234 efgh 5678 ijkl 9012` — copy it (including spaces). You won't see it again.
6. Paste it into `WP_APP_PASSWORD` in your env vars.
7. Set `WP_USERNAME` to the WordPress login name of that user (not the email).
8. Set `WP_SITE_URL` to the site root, e.g. `https://njwebinar.naifa.org` (no trailing slash, no `/wp-admin`).

**Important:** the WordPress user needs to be an Editor or Administrator. Authors can only see their own drafts.

---

## Local setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local — fill in all four variables
npm run dev
```

Visit http://localhost:3000.

---

## Deploy to Netlify

Push to GitHub, import the repo on Netlify (same steps as v1). Add all four environment variables in the Netlify dashboard:

- `ANTHROPIC_API_KEY`
- `WP_SITE_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`

---

## How Matt's workflow looks

1. Matt opens the dashboard URL — sees all drafts as cards, newest first
2. Clicks one — voice editor loads with the post content
3. Listens, thinks, taps the mic, talks ("the second paragraph should mention the new contribution limits and the intro is too soft, make it punchier")
4. Taps stop, taps **Apply Matt's Feedback** — Claude returns a revised version
5. Reviews the revision side-by-side with the original. Accepts or discards.
6. Can iterate — record more feedback on the new version, apply again.
7. Edits the title inline if needed.
8. Taps **Save** in the top bar — the changes go back to WordPress as an update to the same draft.

---

## URL routes

| Route          | What it does                                                       |
| -------------- | ------------------------------------------------------------------ |
| `/`            | Dashboard — list of WordPress drafts                               |
| `/edit/[id]`   | Voice editor for a specific WordPress post                         |
| `/standalone`  | Original paste-a-draft flow with shareable links                   |
| `/api/wp/drafts` | (internal) Returns draft list                                    |
| `/api/wp/post/[id]` | (internal) Returns a single post as markdown                  |
| `/api/wp/save/[id]` | (internal) Saves edits back to WordPress                      |
| `/api/revise`  | (internal) Sends draft + transcript to Claude, returns revision    |

---

## Notes & tradeoffs

- **Gutenberg blocks**: WordPress's block markup (`<!-- wp:paragraph -->` etc.) gets stripped during the markdown round-trip. When you save, the post becomes a "Classic" block in the editor. You can convert it back to blocks in WordPress with one click, but it's a small friction point. If this matters for your workflow, we can build a Gutenberg-aware version later.
- **Drafts only**: by design, the dashboard shows only unpublished posts (draft, pending, private, scheduled). Published posts aren't editable through this UI — that's intentional, since edits to live content usually go through a different review process.
- **Single reviewer**: the app is hardcoded for Matt Simon. Change the `reviewerName` constant in `app/page.jsx` and `app/edit/[id]/page.jsx` for a different reviewer, or refactor to support multiple.
- **No auth on the app itself**: anyone with the URL can see drafts. For a private deploy, add [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) or a password-protected branch (one config line).
- **Speech recognition**: Chrome, Edge, and Safari only. Firefox doesn't support the Web Speech API.

---

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) for icons
- [turndown](https://github.com/mixmark-io/turndown) for HTML → Markdown
- [marked](https://marked.js.org/) for Markdown → HTML
- WordPress REST API + Application Passwords
- Anthropic API (Claude Sonnet 4.6)
