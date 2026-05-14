# Voice Editor

A web app that lets a reviewer revise blog post drafts by **speaking** their feedback. The app transcribes their voice in the browser, sends the transcript + draft to Claude, and produces a revised version they can accept or discard.

Built for sending drafts to a subject matter expert (e.g. Matt Simon) who'd rather talk than type.

---

## How it works

1. You paste a draft in the editor and click **Get link**
2. The URL (which contains the encoded draft) goes to your reviewer
3. They open the link — draft is pre-loaded
4. They tap the mic, talk through their feedback, tap stop
5. They click **Apply Feedback** — Claude revises the draft using their spoken input
6. They Accept or Discard. Accepted revision becomes the new draft and they can iterate.
7. When happy, **Copy draft** sends the final text to clipboard

No login. No install. Works on desktop and most mobile browsers.

---

## Local setup

You'll need [Node.js](https://nodejs.org/) 18+ installed.

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.local.example .env.local
# Then edit .env.local and paste your key from console.anthropic.com

# 3. Run locally
npm run dev
```

Visit http://localhost:3000 and try it out.

---

## Deploy to Vercel (recommended)

Vercel hosts Next.js apps for free and the deployment takes ~3 minutes.

1. Push this folder to a GitHub repo (private is fine):
   ```bash
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/YOU/voice-editor.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, import the repo.

3. In the **Environment Variables** section, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from [console.anthropic.com](https://console.anthropic.com/)

4. Click **Deploy**. You'll get a URL like `voice-editor-xyz.vercel.app`.

5. (Optional) Connect a custom domain in Vercel's project settings.

---

## URL parameters

The app reads two optional query parameters:

| Param  | What it does                                            |
| ------ | ------------------------------------------------------- |
| `d`    | Base64-encoded draft text — pre-fills the editor        |
| `name` | The reviewer's name — shown in the header and prompt    |

The **Get link** button builds these automatically. You can also link directly:

```
https://your-app.vercel.app/?name=Jane%20Doe
```

…to open a blank editor branded for a different reviewer.

---

## Customizing for a different reviewer

The default name is "Matt Simon" but it's overridden by the `name` URL param. If you want a different default, change line 51 of `app/page.jsx`:

```js
const [reviewerName, setReviewerName] = useState('Matt Simon');
```

The Claude prompt that does the revision lives in `app/api/revise/route.js`. Edit that file if you want to change the editorial instructions Claude gets — for example, tightening it for a specific publication's house style.

---

## Notes

- **Browser support for voice**: Chrome and Edge are rock solid. Safari works (desktop + iOS). Firefox doesn't support the Web Speech API.
- **URL length**: Drafts up to roughly 8,000 characters (≈1,300 words) fit comfortably in a shareable URL. For longer pieces, the reviewer can paste directly or you can extend this with a database-backed share-ID system.
- **API key safety**: The Anthropic key only lives on the server (in the `/api/revise` route). The browser never sees it.
- **Cost**: Each "Apply Feedback" call is one Sonnet API request — typically well under a cent per revision for normal-length posts.

---

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) for icons
- Browser-native [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for transcription
- [Anthropic API](https://docs.anthropic.com/) (Claude Sonnet 4.6) for revisions
