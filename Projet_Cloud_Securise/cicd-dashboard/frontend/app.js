const ownerEl = document.getElementById('owner');
const repoEl = document.getElementById('repo');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const deployBtn = document.getElementById('deploy');
const roleEl = document.getElementById('role');
const statusEl = document.getElementById('status');
const runsEl = document.getElementById('runs');
const userAvatarEl = document.getElementById('user-avatar');
const userUsernameEl = document.getElementById('user-username');
const logoutBtn = document.getElementById('logout-btn');
const userInfoEl = document.getElementById('user-info');
const loginInfoEl = document.getElementById('login-info');
const loginBtn = document.getElementById('login-btn');

let pollInterval = null;
let workflowChart = null;
let repoDefaultBranch = null;

function setStatus(txt) { statusEl.textContent = txt }

function setRole(roleText) {
  roleEl.textContent = roleText || '';
}

async function fetchAccess(owner, repo) {
  const url = `/api/access?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Failed to fetch access: ${res.status}`);
  return res.json();
}

async function dispatchWorkflow(owner, repo, ref) {
  const res = await fetch('/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ owner, repo, ref })
  });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Forbidden');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Dispatch failed: ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

async function loadUserInfo() {
  try {
    const res = await fetch('/api/user');
    if (res.status === 401) {
      showLogin();
      return;
    }
    const user = await res.json();
    userAvatarEl.src = user.avatar;
    userUsernameEl.textContent = user.username;
    showUser();
  } catch (err) {
    console.error('Failed to load user info:', err);
    showLogin();
  }
}

function showUser() {
  userInfoEl.style.display = 'flex';
  loginInfoEl.style.display = 'none';
}

function showLogin() {
  userInfoEl.style.display = 'none';
  loginInfoEl.style.display = 'block';
}

function updateChart(successCount, failureCount) {
  const ctx = document.getElementById('workflowChart').getContext('2d');
  if (workflowChart) {
    workflowChart.destroy();
  }
  workflowChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Success', 'Failure'],
      datasets: [{
        data: [successCount, failureCount],
        backgroundColor: ['#4CAF50', '#F44336'],
      }]
    },
    plugins: [ChartDataLabels],
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: 'white'
          }
        },
        title: {
          display: true,
          text: 'Successes and Failures percentage of Workflows',
          color: 'white'
        },
        datalabels: {
          color: 'white',
          formatter: (value, ctx) => {
            let sum = 0;
            ctx.dataset.data.forEach(d => sum += d);
            return sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '';
          }
        }
      }
    }
  });
}

// When using the proxy, the token is kept server-side in the proxy's .env
async function fetchRuns(owner, repo) {
  const url = `/api/runs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  if (res.status === 404) {
    throw new Error('Cannot find repo or owner');
  }
  if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
  return res.json();
}

async function fetchJobs(owner, repo, run_id) {
  const url = `/api/jobs/${run_id}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

function renderRuns(data, owner, repo) {
  runsEl.innerHTML = '<div id="chart-container"><canvas id="workflowChart"></canvas></div>';
  const runs = data.workflow_runs || [];
  if (runs.length === 0) {
    updateChart(0, 0);
    runsEl.innerHTML += '<div class="error">Aucun workflow récent trouvé. Vérifiez les permissions du token ou les paramètres.</div>';
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  runs.forEach(run => {
    if (run.conclusion === 'success') successCount++;
    else if (run.conclusion === 'failure') failureCount++;
    // You can add more conclusions if needed

    const container = document.createElement('div');
    container.className = 'run';
    const header = document.createElement('div');
    header.className = 'run-header';
    header.innerHTML = `
      <div class="title">${run.name || run.workflow_name} — <span class="small">#${run.run_number}</span></div>
      <div class="meta">${run.event} • ${run.status} • ${run.conclusion || '---'}</div>
    `;
    container.appendChild(header);

    const jobsContainer = document.createElement('div');
    jobsContainer.className = 'jobs';
    jobsContainer.textContent = 'Loading jobs...';
    container.appendChild(jobsContainer);

    runsEl.appendChild(container);

    // fetch jobs
    fetchJobs(owner, repo, run.id)
      .then(j => {
        jobsContainer.innerHTML = '';
        j.jobs.forEach(job => {
          const jobEl = document.createElement('div');
          jobEl.className = 'job ' + (job.conclusion || job.status || '').toLowerCase();
          jobEl.innerHTML = `<strong>${job.name}</strong> — ${job.status} ${job.conclusion ? '• ' + job.conclusion : ''} <span class="small">(${job.runner_name || 'runner'})</span>`;
          jobsContainer.appendChild(jobEl);
        })
      })
      .catch(err => {
        jobsContainer.textContent = 'Failed to load jobs: ' + err.message;
      });
  });

  updateChart(successCount, failureCount);
}

async function poll() {
    const owner = ownerEl.value.trim();
    const repo = repoEl.value.trim();
    if (!owner || !repo) {
      setStatus('Provide owner and repo');
      return;
    }
  setStatus('Fetching...');
  try {
    const data = await fetchRuns(owner, repo);
    renderRuns(data, owner, repo);
    setStatus(`Last update: ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
}

startBtn.addEventListener('click', () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  const owner = ownerEl.value.trim();
  const repo = repoEl.value.trim();
  if (!owner || !repo) {
    setStatus('Provide owner and repo');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    return;
  }

  setStatus('Checking access...');
  fetchAccess(owner, repo)
    .then(a => {
      repoDefaultBranch = a.default_branch || null;
      setRole(`Role: ${a.role || 'unknown'}${repoDefaultBranch ? ` • default: ${repoDefaultBranch}` : ''}`);
      const canDeploy = a.role === 'admin' || a.role === 'deployer';
      deployBtn.disabled = !canDeploy;
      poll();
      pollInterval = setInterval(poll, 15000);
    })
    .catch(err => {
      setRole('');
      deployBtn.disabled = true;
      setStatus('Error: ' + err.message);
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
});

stopBtn.addEventListener('click', () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (pollInterval) clearInterval(pollInterval);
  setStatus('Stopped');
});

deployBtn.addEventListener('click', async () => {
  const owner = ownerEl.value.trim();
  const repo = repoEl.value.trim();
  if (!owner || !repo) {
    setStatus('Provide owner and repo');
    return;
  }
  const ref = repoDefaultBranch || 'main';

  deployBtn.disabled = true;
  setStatus(`Dispatching workflow on ${ref}...`);
  try {
    await dispatchWorkflow(owner, repo, ref);
    setStatus(`Dispatch sent (${new Date().toLocaleTimeString()}). Refreshing...`);
    // Give GitHub a moment to create the new run
    setTimeout(() => poll(), 2000);
  } catch (err) {
    setStatus('Error: ' + err.message);
  } finally {
    // Re-enable based on role
    const roleTxt = roleEl.textContent || '';
    const canDeploy = roleTxt.includes('admin') || roleTxt.includes('deployer');
    deployBtn.disabled = !canDeploy;
  }
});

// Nice small helper to prefill owner/repo if running inside this repo
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      showLogin();
      // Clear the dashboard
      runsEl.innerHTML = '';
      setStatus('Disconnected');
      ownerEl.value = '';
      repoEl.value = '';
      setRole('');
      deployBtn.disabled = true;
      repoDefaultBranch = null;
    } catch (err) {
      console.error('Logout failed:', err);
    }
  });
  loginBtn.addEventListener('click', () => {
    window.location.href = '/auth/github';
  });
});
