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
# Run locally from the proxy folder (expects ../frontend to exist):
cd cicd-dashboard/proxy
npm start
# open http://localhost:3000
```

Docker build note

If you want to build the proxy into a container and include the `frontend` files, build from the repository root so the build context contains the sibling `frontend` folder:

```bash
# from repository root (one level above cicd-dashboard)
docker build -f cicd-dashboard/proxy/Dockerfile -t cicd-dashboard-proxy:latest .
docker run -p 3000:3000 --env-file cicd-dashboard/proxy/.env cicd-dashboard-proxy:latest
```

Or build by changing directory into `cicd-dashboard` and using `.` as context:

```bash
cd cicd-dashboard
docker build -f proxy/Dockerfile -t cicd-dashboard-proxy:latest .
docker run -p 3000:3000 --env-file proxy/.env cicd-dashboard-proxy:latest
```

Notes

- The proxy serves files from `../frontend` so open `http://localhost:3000` to use the dashboard without exposing the token to the browser.
- Keep `.env` out of git and rotate tokens regularly.
