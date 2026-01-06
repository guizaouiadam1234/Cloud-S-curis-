require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Missing GITHUB_TOKEN in environment. Create .env with GITHUB_TOKEN.');
  // don't exit so the static site can still be served for development
}

app.use(cors());
app.use(express.json());

// Resolve frontend static folder from a few likely locations so server works
const candidates = [
  path.join(__dirname, 'frontend'),           // proxy/frontend (if copied inside proxy)
  path.join(__dirname, '..', 'frontend'),    // ../frontend (sibling folder)
];

let staticFolder = null;
for (const c of candidates) {
  try {
    if (require('fs').statSync(c).isDirectory()) { staticFolder = c; break; }
  } catch (e) {
    // ignore
  }
}

if (!staticFolder) {
  console.error('Could not locate frontend folder. Tried:');
  candidates.forEach(c => console.error(' -', c));
  console.error('If you run the Docker image, build from the repository root so the frontend folder is included in the image:');
  console.error('  docker build -f cicd-dashboard/proxy/Dockerfile -t cicd-dashboard-proxy:latest .');
  console.error('Or run locally from the repository root so ../frontend exists relative to the proxy folder.');
  process.exit(1);
}

console.log('Serving static files from', staticFolder);
app.use(express.static(staticFolder));

app.get('/api/runs', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `token ${TOKEN}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:runId', async (req, res) => {
  const { owner, repo } = req.query;
  const runId = req.params.runId;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `token ${TOKEN}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  // fallback to index.html for SPA
  res.sendFile(path.join(staticFolder, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy + static server listening on http://localhost:${PORT}`);
});
