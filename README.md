# AIVISION — AI Image Platform

AIVISION is a responsive AI image-generation interface with a light glassmorphism design system. It includes a prompt composer, style presets, artwork inspiration gallery, favorites, recent creations, theme switching, and responsive navigation.

## Preview

Open `index.html` in a browser, or serve the project with a local static server. The current frontend uses plain HTML, CSS, and JavaScript so it can be previewed without a build step.

## Current features

- Light glassmorphism UI with a pastel blue and lavender palette
- Responsive desktop, tablet, and mobile layouts
- Prompt composer with character count and prompt-improvement helper
- Style and aspect-ratio selectors
- Inspiration gallery with category filters and reusable prompts
- Favorite artwork saved in browser storage
- Light/dark theme preference
- Recent image history, export, and download controls
- Image preview modal and keyboard dismissal
- Accessible labels, focus states, and reduced-motion support

## Project files

```text
AI-image-platform/
├── index.html    # Application layout and semantic page structure
├── style.css     # Glassmorphism design system and responsive styles
├── script.js     # UI interactions and image API client
└── README.md     # Project documentation
```

## Run locally

### Option 1: Open directly

Open `index.html` in a modern browser. Some browser security policies may restrict API requests when opening the file directly.

### Option 2: Use a local server

If Python is installed, run this command from the project directory:

```bash
python -m http.server 5500
```

Then visit http://localhost:5500.

## AI image-generation backend

The UI is ready to call a backend endpoint:

```http
POST /api/images/generate
Content-Type: application/json
```

Example request:

```json
{
  "prompt": "A peaceful Japanese garden at sunrise",
  "style": "anime",
  "size": "1024x1024",
  "quality": "standard"
}
```

The endpoint should return JSON containing an image URL, for example:

```json
{
  "imageUrl": "https://your-storage.example/generated-image.png"
}
```

**Important:** The repository currently contains the frontend only. Real image generation will not work until you implement and deploy the server endpoint and configure an AI provider. The frontend intentionally shows an informative error rather than pretending that an image was generated.

Recommended backend additions:

- Node.js + Express or a serverless API route
- Server-side AI provider adapter
- Request validation and rate limiting
- Authentication before saving private user images
- Object storage for generated images
- Database for users, prompts, favorites, and image history
- Environment variables for secrets; never place API keys in browser JavaScript

## Deployment

The static frontend can be deployed to GitHub Pages, Netlify, or Vercel. A real generation endpoint must be deployed separately or as serverless functions and configured to accept requests from the frontend. Configure CORS appropriately if the API uses a different origin.

## Security and privacy notes

- Do not commit real API keys, passwords, or private environment files.
- Browser storage is device-local and is not account-level persistence.
- Validate prompts, request sizes, authentication, and provider responses on the server.
- Add provider-specific moderation, quotas, and rate limits before public launch.

## Roadmap

- [ ] Implement the server-side image-generation endpoint
- [ ] Add secure authentication
- [ ] Persist creations in a database and object storage
- [ ] Add user profiles and community submissions
- [ ] Add automated frontend and API tests

---

Built as a lightweight foundation for a polished AI creativity studio.
