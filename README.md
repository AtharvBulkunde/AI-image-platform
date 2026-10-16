# AIVISION — AI Image Platform

AIVISION is a Pinterest-inspired AI art studio: a responsive masonry inspiration feed, searchable moodboard, reusable prompts, favorites, and a real image-generation endpoint powered by OpenAI's image API.

## What's included

- Pinterest-like masonry discovery gallery with real photography from Unsplash
- Inspiration search, topic filters, favorite pins, and reusable image prompts
- Responsive light glassmorphism UI and dark mode
- Prompt builder, style presets, and image-size selection
- Private studio login with signed, expiring HTTP-only session cookies
- `POST /api/images/generate` server endpoint with input validation and rate limits
- Generated PNGs saved to a local `generated/` folder and served only to authenticated sessions
- Secrets kept in server environment variables, never in browser JavaScript

## Requirements

- Node.js 20 or newer
- An OpenAI API key with access to an image-generation model
- A long private studio password
- A random session secret of at least 32 characters

Image generation can incur provider charges. Check your provider's current pricing and usage limits before using it.

## Run it locally

1. Clone this repository and open its directory:

   ```bash
   git clone https://github.com/AtharvBulkunde/AI-image-platform.git
   cd AI-image-platform
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template to `.env`:

   **Windows PowerShell**
   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and provide your own values:

   ```dotenv
   OPENAI_API_KEY=your_real_api_key
   OPENAI_IMAGE_MODEL=gpt-image-1
   AIVISION_ACCESS_PASSWORD=use_a_long_unique_password
   AIVISION_SESSION_SECRET=replace_with_a_random_secret_at_least_32_characters
   PORT=3000
   NODE_ENV=development
   ```

   Generate a session secret with Node.js:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Never commit `.env` or share your API key. The repository ignores `.env` files; only the safe `.env.example` template belongs in Git.

5. Start the server:

   ```bash
   npm start
   ```

6. Open http://localhost:3000, enter the studio password, describe an image, choose a style and aspect ratio, and select **Generate image**.

Do not use `python -m http.server` for the full application: it serves static files only and does not run the API endpoint. Run the Node.js server instead.

## API

### `POST /api/images/generate`

Requires an authenticated studio session cookie. The frontend obtains this through `POST /api/auth/login`.

Example JSON request:

```json
{
  "prompt": "A peaceful Japanese garden at sunrise, soft pastel colors",
  "style": "anime",
  "size": "1024x1024",
  "quality": "standard"
}
```

Successful response:

```json
{
  "imageUrl": "/generated/<random-image-id>.png",
  "prompt": "A peaceful Japanese garden at sunrise, soft pastel colors",
  "style": "anime",
  "size": "1024x1024",
  "createdAt": "2026-10-16T12:00:00.000Z"
}
```

The server validates prompt length, style, and image dimensions; rate-limits generation and login; calls the provider using the server-side key; and saves the returned image bytes locally. Provider credentials and raw error details are not sent to the browser.

Other routes:

- `GET /api/health` — minimal service/provider configuration status
- `GET /api/auth/status` — current session status
- `POST /api/auth/login` — validate the studio password and issue an HTTP-only cookie
- `POST /api/auth/logout` — clear the studio session
- `GET /generated/:filename` — serve an image only to an authenticated session

## Deploying

Deploy to a Node.js host that supports persistent storage, or adapt the image storage layer to object storage. Set all secrets in the host's environment-variable dashboard. Set `NODE_ENV=production` and use HTTPS; secure cookies are enabled in production.

The current implementation writes generated PNGs into the local `generated/` directory. Ephemeral serverless filesystems may delete those files between requests or deployments; use durable object storage for that environment. Configure proxy trust carefully if your host uses a reverse proxy.

The single studio password is suitable for a private demo, not a multi-user production service. For a public launch, add individual user accounts, persistent per-user image records, CSRF protection appropriate to your authentication architecture, quotas, abuse monitoring, and durable image storage.

## Pinterest-style inspiration imagery

The masonry gallery uses direct Unsplash image URLs as visual inspiration. It does not scrape or hotlink images from Pinterest. If you want to import pins from a Pinterest account, use Pinterest's approved API and comply with its permissions and content rights.

## Troubleshooting

- **Server says credentials are missing:** confirm `.env` exists and has `OPENAI_API_KEY`, `AIVISION_ACCESS_PASSWORD`, and `AIVISION_SESSION_SECRET` set.
- **Provider says unauthorized or quota exceeded:** check your API key, model access, billing, and provider limits.
- **Images disappear after deployment:** use persistent storage or object storage rather than an ephemeral filesystem.
- **Login cookie is not saved:** ensure the browser uses the same origin; production deployments must use HTTPS.

---

Built as a lightweight foundation for a private AI creativity studio.
