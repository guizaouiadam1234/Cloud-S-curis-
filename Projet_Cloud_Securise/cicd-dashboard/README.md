# CICD Dashboard

This small static dashboard polls the GitHub Actions API and displays the latest workflow runs and job statuses for a repository.

Usage

- Open `cicd-dashboard/frontend/index.html` in a browser or serve the folder with a tiny static server (recommended):

```powershell
# from repository root
cd cicd-dashboard/frontend
# using Python
python -m http.server 8000
# or using npm http-server if installed
npx http-server -p 8000
```

- In the dashboard fill `Owner` and `Repo` (e.g. `your-username` and `your-repo`) and paste a GitHub Personal Access Token (PAT) with `repo` scope. Click `Start` to poll.

Security notes

- The token is used in-browser to call the GitHub API. Do NOT use a high-privilege token or share it. For production hosting, implement a small backend proxy to keep the token secret.

Next steps (optional)

- Add a small Node/Express proxy that reads a token from environment variables and exposes an internal endpoint `GET /api/runs` to the frontend. This keeps the PAT off the client.
- Host this dashboard on your VM or GitHub Pages (if the repo is public and you avoid sending a token).