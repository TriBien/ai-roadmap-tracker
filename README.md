# AI Engineer Roadmap Tracker

A learning tracking web app for the [AI Engineer Roadmap: 28 Weeks](../ai-engineer-roadmap-28-weeks.md) (Python-first, Go and Rust where production demands). Built with React and Vite, deployable to GitHub Pages.

## What it does

- Renders the full 28-week roadmap (two phases) from the source markdown.
- Lets you mark weeks as `not-started`, `in-progress` or `completed`.
- Lets you tick off individual checklist items grouped by section (Fundamental, Targets, Implement, Practical project, Production mapping, Acceptance, Deliverable).
- Lets you keep freeform notes per week.
- Shows a summary: weeks completed, in-progress, not-started, items checked, overall completion %.

## Development guidelines

Requirements: Node.js 20+ and npm.

```bash
npm install
```

Common commands:

```bash
npm run dev      # start the Vite dev server
npm run build    # runs scripts/parse-roadmap.mjs, then builds to dist/
npm run preview  # preview the production build locally
npx tsc -p tsconfig.json --noEmit   # typecheck
```

The roadmap markdown is parsed into `src/data/roadmap.json` by `scripts/parse-roadmap.mjs` (invoked by the `prebuild` script). After changing `ai-engineer-roadmap-28-weeks.md`, re-run `npm run build` (or `npm run dev`) to regenerate the embedded roadmap data.

## End-user usage

### Running locally

```bash
npm run dev
```

Then open the printed local URL (default: http://localhost:5173).

### Deploying to GitHub Pages

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and deploys it to GitHub Pages on pushes to `main` or `master`.

1. Push this project to a GitHub repository.
2. In the repository settings, set **Pages → Source** to **GitHub Actions**.
3. Push to `main` (or trigger the workflow manually).

The Vite config uses `base: "./"`, so the built app works from a project pages path.

### Tracking progress

- Use the status dropdown on each week card.
- Tick checklist items as you complete them (ticks are kept per section item).
- Add notes for decisions, blockers, links, next steps.

### Syncing progress with Documents/ai-roadmap-tracker.json

Progress auto-loads and auto-saves to a JSON file on the user's local machine:

1. Click **Connect ai-roadmap-tracker.json** and choose (or create) `Documents/ai-roadmap-tracker.json` in the file picker.
2. When Chrome asks for permission, choose **Allow on every visit** (persistent permission). The app stores the file handle and keeps the file in sync automatically on every change (writes are debounced).
3. After that, the app restores the file on every page open or reload without asking again. If access needs a one-time re-approval, click **Reconnect** and choose **Allow on every visit**.

For guaranteed prompt-free access, install the app: open the browser menu and choose **Install** (Chrome/Edge). Installed apps keep file permissions automatically once granted.

Direct file access uses the File System Access API (Chrome/Edge). In other browsers, use **Export JSON** / **Import JSON**. Progress is also cached in browser storage as a fallback.

Progress file format:

```json
{
  "app": "ai-roadmap-tracker",
  "version": 1,
  "updatedAt": "2026-11-06T08:30:00.000Z",
  "weeks": {
    "p1:1": {
      "status": "in-progress",
      "notes": "Building the provider-agnostic gateway.",
      "checkedItems": ["p1|1|fundamental|0"]
    }
  }
}
```

## Project structure

```
ai-roadmap-tracker/
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── scripts/parse-roadmap.mjs      # roadmap markdown -> src/data/roadmap.json
├── src/
│   ├── App.tsx                     # main app, progress state, file sync actions
│   ├── components/                 # PhaseSection, WeekCard, SummaryBar
│   ├── lib/                        # roadmap data, progress (de)serialization, file sync
│   ├── data/roadmap.json          # generated roadmap data
│   └── index.css
├── public/                        # PWA manifest, service worker, icons
├── index.html
├── vite.config.ts
└── package.json
```
