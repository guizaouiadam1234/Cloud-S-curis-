# Proxy server for CI/CD Dashboard

This small Node/Express proxy keeps your GitHub token on the server and exposes safe endpoints for the dashboard.

Setup

1. Install dependencies:

```bash
cd cicd-dashboard/proxy
npm install
```

2. Create `.env` from `.env.example` and paste your PAT into `GITHUB_TOKEN`:

```bash
cp .env.example .env
# edit .env and set GITHUB_TOKEN
```

3. Start the proxy (it will also serve the static dashboard):

```bash
npm start
# open http://localhost:3000
```

Notes

- The proxy serves files from `../frontend` so open `http://localhost:3000` to use the dashboard without exposing the token to the browser.
- Keep `.env` out of git and rotate tokens regularly.
