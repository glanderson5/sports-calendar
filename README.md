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

## Why a self-hosted runner

ESPN's bot-protection (Akamai) returns 403 for requests from GitHub-hosted
Actions runner IPs — it only works from a normal residential/non-datacenter
IP. So the `build` job (`.github/workflows/deploy.yml`) runs on a
**self-hosted runner** instead of `ubuntu-latest`.

That runner is installed as a Windows service on this PC, at `C:\actions-runner`
(kept at a short root-level path — a deep path like one under `C:\Users\...`
causes the Windows runner service to fail to start with a generic "Incorrect
function" error). It auto-starts on boot and picks up the 6-hour cron
automatically. If the PC is off, scheduled refreshes are simply skipped until
it's back on — you can also trigger a refresh manually from the repo's
**Actions** tab ("Run workflow") once it's back online.

To check on it:

```powershell
Get-Service -Name 'actions.runner.glanderson5-sports-calendar.sports-calendar-runner'
```

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
