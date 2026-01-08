const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

function parseCsvList(v) {
  if (!v) return [];
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// Optional allowlist for who can trigger deployments from the dashboard.
// Example: DEPLOY_ALLOW_USERS="guizaouiadam1234"
const DEPLOY_ALLOW_USERS = parseCsvList(process.env.DEPLOY_ALLOW_USERS);

function isDeployAllowedForUser(githubUsername) {
  if (DEPLOY_ALLOW_USERS.length === 0) return true; // no restriction configured
  return DEPLOY_ALLOW_USERS.includes(String(githubUsername || '').trim());
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(session({
  secret: 'your-secret-key', // Hardcoded to avoid .env
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth setup route
app.post('/auth/setup', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).send('Client ID and Client Secret required');
  }
  // Configure Passport with provided credentials
  passport.use(new GitHubStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: `http://localhost:${PORT}/auth/github/dashboard`
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }));
  // Store in session for later use
  req.session.clientId = clientId;
  req.session.clientSecret = clientSecret;
  res.redirect('/auth/github');
});

// Auth routes
app.get('/auth/github', (req, res, next) => {
  if (!req.session.clientId || !req.session.clientSecret) {
    return res.redirect('/login');
  }
  passport.authenticate('github', { scope: ['repo', 'workflow'] })(req, res, next);
});

app.get('/auth/github/dashboard', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect('/login');
}

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
app.use('/api', ensureAuthenticated); // Protect API routes
app.use(express.static(staticFolder));

app.get('/api/user', ensureAuthenticated, (req, res) => {
  res.json({
    username: req.user.username,
    avatar: req.user.photos ? req.user.photos[0].value : null
  });
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

app.get('/api/runs', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `token ${req.user.accessToken}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchRepo(owner, repo, token) {
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`
    }
  });
  if (r.status === 404) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.message || 'Repository not found');
  }
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.message || `GitHub API error (${r.status})`);
  }
  return r.json();
}

function roleFromPermissions(permissions) {
  if (!permissions) return 'viewer';
  if (permissions.admin) return 'admin';
  if (permissions.push) return 'deployer';
  return 'viewer';
}

app.get('/api/access', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });
  try {
    const repoInfo = await fetchRepo(owner, repo, req.user.accessToken);
    const role = roleFromPermissions(repoInfo.permissions);

    const hasRepoDeployRight = role === 'admin' || role === 'deployer';
    const isAllowedUser = isDeployAllowedForUser(req.user.username);
    const can_deploy = hasRepoDeployRight && isAllowedUser;
    let deploy_reason = null;
    if (!hasRepoDeployRight) deploy_reason = 'Requires push/admin on the repository';
    else if (!isAllowedUser) deploy_reason = 'Not allowlisted to deploy';

    res.json({
      owner,
      repo,
      role,
      can_deploy,
      deploy_reason,
      permissions: repoInfo.permissions || null,
      default_branch: repoInfo.default_branch || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dispatch', async (req, res) => {
  const { owner, repo, ref } = req.body || {};
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });

  try {
    if (!isDeployAllowedForUser(req.user.username)) {
      return res.status(403).json({ error: 'Forbidden: you are not allowlisted to deploy' });
    }

    const repoInfo = await fetchRepo(owner, repo, req.user.accessToken);
    const role = roleFromPermissions(repoInfo.permissions);
    if (!(role === 'admin' || role === 'deployer')) {
      return res.status(403).json({ error: 'Forbidden: requires push/admin on the repository' });
    }

    const dispatchRef = (ref && String(ref).trim()) || repoInfo.default_branch || 'main';
    const workflowFile = process.env.WORKFLOW_FILE || 'ci.yml';

    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        Authorization: `token ${req.user.accessToken}`
      },
      body: JSON.stringify({ ref: dispatchRef })
    });

    if (r.status === 204) {
      return res.json({ ok: true, ref: dispatchRef, workflow: workflowFile });
    }

    const data = await r.json().catch(() => ({}));
    return res.status(r.status).json({
      error: data.message || `Dispatch failed (${r.status})`,
      details: data
    });
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
      headers: { Accept: 'application/vnd.github+json', Authorization: `token ${req.user.accessToken}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`
    <html>
      <head>
        <title>Login - CI/CD Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
          h1 { color: #333; }
          form { display: inline-block; text-align: left; }
          label { display: block; margin: 10px 0 5px; }
          input { width: 100%; padding: 8px; margin-bottom: 10px; }
          button { padding: 10px 20px; background: #24292e; color: white; border: none; border-radius: 5px; cursor: pointer; }
          button:hover { background: #1a1e22; }
        </style>
      </head>
      <body>
        <h1>CI/CD Dashboard</h1>
        <p>Entrez vos credentials GitHub OAuth pour vous connecter.</p>
        <form action="/auth/setup" method="post">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" name="clientId" required>
          <label for="clientSecret">Client Secret:</label>
          <input type="password" id="clientSecret" name="clientSecret" required>
          <button type="submit">Connexion</button>
        </form>
      </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(staticFolder, 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('*', ensureAuthenticated, (req, res) => {
  // fallback to index.html for SPA
  res.sendFile(path.join(staticFolder, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy + static server listening on http://localhost:${PORT}`);
});
