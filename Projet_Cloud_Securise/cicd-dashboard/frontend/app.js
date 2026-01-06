const ownerEl = document.getElementById('owner');
const repoEl = document.getElementById('repo');
const tokenEl = document.getElementById('token');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const runsEl = document.getElementById('runs');

let pollInterval = null;
console.log(test);
function setStatus(txt) { statusEl.textContent = txt }

// When using the proxy, the token is kept server-side in the proxy's .env
async function fetchRuns(owner, repo) {
  const url = `/api/runs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
  return res.json();
}

async function fetchJobs(owner, repo, run_id) {
  const url = `/api/jobs/${run_id}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

function renderRuns(data, owner, repo, token) {
  runsEl.innerHTML = '';
  const runs = data.workflow_runs || [];
  if (runs.length === 0) {
    runsEl.innerHTML = '<div class="empty">No recent runs</div>';
    return;
  }

  runs.forEach(run => {
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
    fetchJobs(owner, repo, run.id, token)
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
  poll();
  pollInterval = setInterval(poll, 15000);
});

stopBtn.addEventListener('click', () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (pollInterval) clearInterval(pollInterval);
  setStatus('Stopped');
});

// Nice small helper to prefill owner/repo if running inside this repo
document.addEventListener('DOMContentLoaded', () => {
  // nothing — user must fill in
});
