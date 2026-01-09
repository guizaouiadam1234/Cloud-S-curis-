const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const fetch = require('node-fetch');
const cors = require('cors');
const { pipeline } = require('stream');
const fs = require('fs');

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

const DATA_DIR = path.join(__dirname, 'data');
const USERS_DB_PATH = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function loadUsersDb() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { users: {} };
    if (!parsed.users || typeof parsed.users !== 'object') parsed.users = {};
    return parsed;
  } catch {
    return { users: {} };
  }
}

function saveUsersDb(db) {
  ensureDataDir();
  const tmpPath = `${USERS_DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, USERS_DB_PATH);
}

function upsertSeenUser(profile) {
  const username = profile && profile.username;
  if (!username) return;
  const db = loadUsersDb();
  const existing = db.users[username] || {};
  const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : existing.avatar || null;
  db.users[username] = {
    username,
    avatar,
    lastSeenAt: new Date().toISOString(),
    // deployAllowed is an extra dashboard-side restriction.
    // If unset, it means "no explicit dashboard restriction".
    deployAllowed: typeof existing.deployAllowed === 'boolean' ? existing.deployAllowed : undefined,
  };
  saveUsersDb(db);
}

function isDeployAllowedForUser(githubUsername) {
  const u = String(githubUsername || '').trim();
  if (!u) return false;

  // 1) Static env allowlist always grants if matched.
  if (DEPLOY_ALLOW_USERS.length > 0 && DEPLOY_ALLOW_USERS.includes(u)) return true;

  // 2) Managed allowlist from users DB (if set for any user).
  const db = loadUsersDb();
  const users = db.users || {};
  const hasAnyExplicitRule = Object.values(users).some(v => typeof v.deployAllowed === 'boolean');
  if (hasAnyExplicitRule) {
    return users[u] && users[u].deployAllowed === true;
  }

  // 3) Default: allow (no restriction configured).
  return true;
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

// Track authenticated users so they can appear in the Users list.
app.use((req, _res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    try { upsertSeenUser(req.user); } catch { /* ignore */ }
  }
  next();
});

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

app.get('/api/me', ensureAuthenticated, (req, res) => {
  res.json({
    username: req.user.username,
    avatar: req.user.photos ? req.user.photos[0].value : null,
    canManageUsers: !!req.session.can_manage_users,
    lastRepo: req.session.last_owner && req.session.last_repo ? { owner: req.session.last_owner, repo: req.session.last_repo } : null
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

async function fetchCollaborators(owner, repo, token) {
  // Requires repo access; for orgs, listing may be limited by org settings.
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators?per_page=100`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`
    }
  });
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

async function ensureUserManager(req, res, next) {
  // Admin-only: requires repo admin on the selected repository.
  const owner = req.query.owner || req.session.last_owner;
  const repo = req.query.repo || req.session.last_repo;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner & repo required (open dashboard and click Start first)' });
  }

  try {
    const repoInfo = await fetchRepo(owner, repo, req.user.accessToken);
    const role = roleFromPermissions(repoInfo.permissions);
    if (role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden: requires repo admin' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// List all known users + their dashboard deploy permission override.
app.get('/api/users', ensureAuthenticated, ensureUserManager, (req, res) => {
  const owner = req.query.owner || req.session.last_owner;
  const repo = req.query.repo || req.session.last_repo;
  const db = loadUsersDb();
  const dbUsers = db.users || {};

  // Start with users we have stored.
  const merged = new Map();
  for (const [username, u] of Object.entries(dbUsers)) {
    merged.set(username, {
      username,
      avatar: u.avatar || null,
      lastSeenAt: u.lastSeenAt || null,
      deployAllowed: typeof u.deployAllowed === 'boolean' ? u.deployAllowed : undefined,
      source: 'db'
    });
  }

  // Also include repo collaborators so admins can manage users who never logged in.
  (async () => {
    try {
      if (owner && repo) {
        const collabs = await fetchCollaborators(owner, repo, req.user.accessToken);
        for (const c of collabs) {
          const username = c.login;
          const existing = merged.get(username);
          merged.set(username, {
            username,
            avatar: c.avatar_url || (existing && existing.avatar) || null,
            lastSeenAt: (existing && existing.lastSeenAt) || null,
            deployAllowed: existing ? existing.deployAllowed : undefined,
            source: existing ? existing.source : 'github'
          });
        }
      }
    } catch (err) {
      // If GitHub refuses collaborator listing, still return DB users.
      console.warn('Failed to list collaborators:', err.message);
    }

    const users = Array.from(merged.values());
    users.sort((a, b) => String(a.username).localeCompare(String(b.username)));
    res.json({ users });
  })();
});

// Add a user to the dashboard-managed list (even if they never logged in).
app.post('/api/users', ensureAuthenticated, ensureUserManager, (req, res) => {
  const { username, deployAllowed } = req.body || {};
  const u = String(username || '').trim();
  if (!u) return res.status(400).json({ error: 'username required' });
  if (typeof deployAllowed !== 'undefined' && typeof deployAllowed !== 'boolean') {
    return res.status(400).json({ error: 'deployAllowed must be boolean if provided' });
  }

  const db = loadUsersDb();
  const existing = db.users[u] || { username: u };
  db.users[u] = {
    username: u,
    avatar: existing.avatar || null,
    lastSeenAt: existing.lastSeenAt || null,
    deployAllowed: typeof deployAllowed === 'boolean' ? deployAllowed : (typeof existing.deployAllowed === 'boolean' ? existing.deployAllowed : undefined)
  };
  saveUsersDb(db);
  res.json({ ok: true, user: db.users[u] });
});

// Update a user's dashboard deploy permission.
app.put('/api/users/:username', ensureAuthenticated, ensureUserManager, (req, res) => {
  const target = String(req.params.username || '').trim();
  if (!target) return res.status(400).json({ error: 'username required' });

  const { deployAllowed } = req.body || {};
  if (typeof deployAllowed !== 'boolean') {
    return res.status(400).json({ error: 'deployAllowed must be boolean' });
  }

  const db = loadUsersDb();
  const existing = db.users[target] || { username: target };
  db.users[target] = {
    username: target,
    avatar: existing.avatar || null,
    lastSeenAt: existing.lastSeenAt || null,
    deployAllowed
  };
  saveUsersDb(db);
  res.json({ ok: true, user: db.users[target] });
});

// Remove a user from the dashboard-managed list.
// Note: if they are a repo collaborator, they can still appear in the list (source=github)
// but will have no dashboard override after deletion.
app.delete('/api/users/:username', ensureAuthenticated, ensureUserManager, (req, res) => {
  const target = String(req.params.username || '').trim();
  if (!target) return res.status(400).json({ error: 'username required' });
  const db = loadUsersDb();
  if (db.users && db.users[target]) {
    delete db.users[target];
    saveUsersDb(db);
  }
  res.json({ ok: true });
});

app.get('/api/access', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });
  try {
    const repoInfo = await fetchRepo(owner, repo, req.user.accessToken);
    const role = roleFromPermissions(repoInfo.permissions);

    // Remember last selected repo for /users management.
    req.session.last_owner = owner;
    req.session.last_repo = repo;
    req.session.can_manage_users = role === 'admin';

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
      can_manage_users: role === 'admin',
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

// Download the full logs for a workflow run (ZIP).
// GitHub returns a redirect to a temporary storage URL; node-fetch follows it.
app.get('/api/run-logs/:runId', async (req, res) => {
  const { owner, repo } = req.query;
  const runId = req.params.runId;
  if (!owner || !repo) return res.status(400).json({ error: 'owner & repo required' });

  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${req.user.accessToken}`
      },
      redirect: 'follow'
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(r.status).json({ error: text || `Failed to fetch logs (${r.status})` });
    }

    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="run-${runId}-logs.zip"`);

    pipeline(r.body, res, (err) => {
      if (err) {
        console.error('Error streaming run logs:', err);
        if (!res.headersSent) {
          res.status(500).end('Error streaming logs');
        } else {
          res.end();
        }
      }
    });
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
        <p>Enter your GitHub OAuth credentials to log in.</p>
        <form action="/auth/setup" method="post">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" name="clientId" required>
          <label for="clientSecret">Client Secret:</label>
          <input type="password" id="clientSecret" name="clientSecret" required>
          <button type="submit">Log in</button>
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

app.get('/users', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(staticFolder, 'users.html'));
});

app.get('*', ensureAuthenticated, (req, res) => {
  // fallback to index.html for SPA
  res.sendFile(path.join(staticFolder, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy + static server listening on http://localhost:${PORT}`);
});
