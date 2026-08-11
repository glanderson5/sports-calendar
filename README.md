# Sports Calendar

A fully static calendar of game times for Tottenham Hotspur, the Minnesota
Vikings, the Minnesota Lynx, and Formula 1 — color-coded by team, all times
shown in Central. No backend, no always-on server: a GitHub Actions workflow
refreshes the schedule data on a cron and redeploys to GitHub Pages.

## How it works

- `frontend/scripts/fetchGames.ts` pulls schedules from ESPN's public
  endpoints (NFL, WNBA, EPL) and the Jolpica-F1 API, normalizes them, and
  writes `frontend/public/games.json`.
- The React app (`frontend/src`) fetches that JSON at load time and renders
  it with `react-big-calendar`.
- `.github/workflows/deploy.yml` runs the fetch script + build every 6 hours
  (and on every push to `main`), then deploys `frontend/dist` to GitHub
  Pages.

## Local development

```bash
cd frontend
npm install
npm run fetch-data   # writes public/games.json
npm run dev
```

## Deploying

1. Push this repo to GitHub.
2. In the repo's **Settings → Pages**, set Source to **GitHub Actions**.
3. The `deploy.yml` workflow will build and publish automatically (also
   runnable on demand from the Actions tab via "Run workflow").
