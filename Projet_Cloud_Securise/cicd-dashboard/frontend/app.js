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
const usersLinkEl = document.getElementById('users-link');

// Modal elements
const modal = document.getElementById('pipeline-modal');
const modalHeader = document.getElementById('modal-header');
const modalDetails = document.getElementById('modal-details');
const closeBtn = document.querySelector('.close');

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
    const res = await fetch('/api/me');
    if (res.status === 401) {
      showLogin();
      return;
    }
    const user = await res.json();
    userAvatarEl.src = user.avatar;
    userUsernameEl.textContent = user.username;
    if (usersLinkEl) {
      usersLinkEl.style.display = user.canManageUsers ? 'inline-block' : 'none';
    }
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

// Modal functions
function openModal(run, owner, repo) {
  modalHeader.innerHTML = `<div class="title">${run.name || run.workflow_name} — <span class="small">#${run.run_number}</span></div>
    <div class="meta">${run.event} • ${run.status} • ${run.conclusion || '---'}</div>`;
  modalDetails.innerHTML = '<div>Loading details...</div>';
  modal.style.display = 'block';
  loadModalDetails(run, owner, repo);
}

function closeModal() {
  modal.style.display = 'none';
}

closeBtn.onclick = closeModal;

window.onclick = function(event) {
  if (event.target == modal) {
    closeModal();
  }
}

async function loadModalDetails(run, owner, repo) {
  try {
    const [jobsData, zipBuf] = await Promise.all([
      fetchJobs(owner, repo, run.id),
      fetchRunLogsZip(owner, repo, run.id)
    ]);

    const logFiles = await unzipTextLogs(zipBuf);

    modalDetails.innerHTML = '';

    const actionsRow = document.createElement('div');
    actionsRow.className = 'run-actions';
    const downloadLink = document.createElement('a');
    downloadLink.className = 'run-download';
    downloadLink.href = `/api/run-logs/${run.id}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
    downloadLink.textContent = 'Download run logs (zip)';
    downloadLink.target = '_blank';
    actionsRow.appendChild(downloadLink);
    modalDetails.appendChild(actionsRow);

    const jobsContainer = document.createElement('div');
    jobsContainer.className = 'jobs';
    const jobs = jobsData.jobs || [];
    if (jobs.length === 0) {
      jobsContainer.textContent = 'No jobs found for this run.';
    } else {
      jobs.forEach(job => {
        const jobBlock = document.createElement('div');
        jobBlock.className = 'job-block';

        const jobHeader = document.createElement('div');
        jobHeader.className = 'job ' + (job.conclusion || job.status || '').toLowerCase();
        jobHeader.innerHTML = `<strong>${job.name}</strong> — ${job.status} ${job.conclusion ? '• ' + job.conclusion : ''} <span class="small">(${job.runner_name || 'runner'})</span>`;
        jobBlock.appendChild(jobHeader);

        const stepsWrap = document.createElement('div');
        stepsWrap.className = 'steps';
        const steps = job.steps || [];
        if (steps.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'empty';
          empty.textContent = 'No step metadata available.';
          stepsWrap.appendChild(empty);
        } else {
          steps.forEach(step => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'step-btn ' + (step.conclusion || step.status || '').toLowerCase();
            btn.textContent = `${step.name} — ${step.status}${step.conclusion ? ' • ' + step.conclusion : ''}`;

            btn.addEventListener('click', async (e) => {
              e.stopPropagation();

              const matched = bestLogMatchForJob(job.name, logFiles || []);
              if (!matched) {
                alert('Could not match a log file for this job; try Download run logs (zip).');
                return;
              }

              const sliced = sliceLogForStep(matched.content, step.name);
              const logModal = document.createElement('div');
              logModal.className = 'log-modal';
              logModal.innerHTML = `
                <div class="log-modal-content">
                  <span class="log-close">&times;</span>
                  <h3>${job.name} / ${step.name}</h3>
                  <pre class="log-pre">${sliced.content}</pre>
                </div>
              `;
              document.body.appendChild(logModal);
              logModal.style.display = 'block';

              const logClose = logModal.querySelector('.log-close');
              logClose.onclick = () => document.body.removeChild(logModal);
              logModal.onclick = (e) => { if (e.target === logModal) document.body.removeChild(logModal); };
            });

            stepsWrap.appendChild(btn);
          });
        }
        jobBlock.appendChild(stepsWrap);
        jobsContainer.appendChild(jobBlock);
      });
    }
    modalDetails.appendChild(jobsContainer);
  } catch (err) {
    modalDetails.innerHTML = 'Failed to load details: ' + err.message;
  }
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

async function fetchRunLogsZip(owner, repo, run_id) {
  const url = `/api/run-logs/${run_id}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch logs: ${res.status}`);
  }
  return res.arrayBuffer();
}

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\.(txt|log)$/g, '')
    .replace(/^[0-9]+[_ -]*/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bestLogMatchForJob(jobName, logFiles) {
  const target = normalizeKey(jobName);
  if (!target) return null;

  let best = null;
  let bestScore = -1;

  for (const f of logFiles) {
    const base = f.name.split('/').pop();
    const key = normalizeKey(base);
    if (!key) continue;

    let score = 0;
    if (key === target) score = 100;
    else if (key.includes(target)) score = 80;
    else if (target.includes(key)) score = 60;
    else {
      // light token overlap scoring
      const targetTokens = new Set(target.split(' '));
      const keyTokens = key.split(' ');
      const overlap = keyTokens.filter(t => targetTokens.has(t)).length;
      score = overlap;
    }

    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }

  return bestScore >= 2 ? best : best; // allow weak matches; we fallback to showing full job log anyway
}

function sliceLogForStep(logText, stepName) {
  const text = String(logText || '');
  const name = String(stepName || '').trim();
  if (!text) return { ok: false, content: '' };
  if (!name) return { ok: false, content: text };

  const lines = text.split(/\r?\n/);

  // Prefer GitHub Actions grouping markers.
  const groupPrefix = '##[group]';
  const endGroupPrefix = '##[endgroup]';

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(groupPrefix) && line.toLowerCase().includes(name.toLowerCase())) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    // Fallback: first line containing the step name
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(name.toLowerCase())) {
        startIdx = Math.max(0, i - 1);
        break;
      }
    }
  }

  if (startIdx === -1) {
    return { ok: false, content: text };
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(endGroupPrefix)) {
      endIdx = i + 1;
      break;
    }
    if (line.startsWith(groupPrefix)) {
      endIdx = i;
      break;
    }
  }

  return { ok: true, content: lines.slice(startIdx, endIdx).join('\n') };
}

function ensureJsZip() {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip not loaded (check index.html includes jszip)');
  }
}

async function unzipTextLogs(zipArrayBuffer) {
  ensureJsZip();
  const zip = await JSZip.loadAsync(zipArrayBuffer);
  const files = [];
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    if (!/\.(txt|log)$/i.test(entry.name)) continue;
    const content = await entry.async('string');
    files.push({ name: entry.name, content });
  }
  return files;
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
    const seeDetailsBtn = document.createElement('button');
    seeDetailsBtn.className = 'see-details-btn';
    seeDetailsBtn.textContent = 'See Details';
    header.appendChild(seeDetailsBtn);
    container.appendChild(header);

    // Add jobs summary to the tile
    const jobsSummary = document.createElement('div');
    jobsSummary.className = 'jobs-summary';
    jobsSummary.textContent = 'Loading jobs...';
    container.appendChild(jobsSummary);

    runsEl.appendChild(container);

    // Load jobs for summary
    fetchJobs(owner, repo, run.id).then(jobsData => {
      const jobs = jobsData.jobs || [];
      jobsSummary.innerHTML = '';
      if (jobs.length === 0) {
        jobsSummary.textContent = 'No jobs';
      } else {
        jobs.forEach(job => {
          const jobItem = document.createElement('div');
          jobItem.className = 'job-summary ' + (job.conclusion || job.status || '').toLowerCase();
          jobItem.innerHTML = `<strong>${job.name}</strong> — ${job.status}${job.conclusion ? ' • ' + job.conclusion : ''}`;
          jobsSummary.appendChild(jobItem);
        });
      }
    }).catch(err => {
      jobsSummary.textContent = 'Failed to load jobs';
    });

    seeDetailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(run, owner, repo);
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
    if (usersLinkEl) usersLinkEl.style.display = 'none';
    return;
  }

  setStatus('Checking access...');
  fetchAccess(owner, repo)
    .then(a => {
      repoDefaultBranch = a.default_branch || null;
      const canDeploy = !!a.can_deploy;
      const reason = a.deploy_reason ? ` • ${a.deploy_reason}` : '';
      setRole(`Role: ${a.role || 'unknown'}${repoDefaultBranch ? ` • default: ${repoDefaultBranch}` : ''}${canDeploy ? '' : reason}`);
      deployBtn.disabled = !canDeploy;
      if (usersLinkEl) {
        usersLinkEl.style.display = a.can_manage_users ? 'inline-block' : 'none';
      }
      poll();
      pollInterval = setInterval(poll, 15000);
    })
    .catch(err => {
      setRole('');
      deployBtn.disabled = true;
      setStatus('Error: ' + err.message);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      if (usersLinkEl) usersLinkEl.style.display = 'none';
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
    // Re-enable based on latest server-side access decision
    try {
      const a = await fetchAccess(owner, repo);
      deployBtn.disabled = !a.can_deploy;
    } catch {
      deployBtn.disabled = true;
    }
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
