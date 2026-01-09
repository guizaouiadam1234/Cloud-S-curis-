const statusEl = document.getElementById('status');
const usersEl = document.getElementById('users');
const reloadBtn = document.getElementById('reload');
const addUsernameEl = document.getElementById('add-username');
const addDeployEl = document.getElementById('add-deploy');
const addBtnEl = document.getElementById('add-btn');

const userAvatarEl = document.getElementById('user-avatar');
const userUsernameEl = document.getElementById('user-username');
const logoutBtn = document.getElementById('logout-btn');

function setStatus(txt) { statusEl.textContent = txt; }

async function fetchMe() {
  const res = await fetch('/api/me', { headers: { Accept: 'application/json' } });
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) throw new Error(`Failed to load user: ${res.status}`);
  return res.json();
}

async function fetchUsers() {
  const res = await fetch('/api/users', { headers: { Accept: 'application/json' } });
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed to fetch users: ${res.status}`);
  return data;
}

async function updateUser(username, deployAllowed) {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ deployAllowed })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) throw new Error(data.error || `Failed to update user: ${res.status}`);
  return data;
}

async function addUser(username, deployAllowed) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, deployAllowed })
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) throw new Error(data.error || `Failed to add user: ${res.status}`);
  return data;
}

async function removeUser(username) {
  const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }
  if (!res.ok) throw new Error(data.error || `Failed to remove user: ${res.status}`);
  return data;
}

function render(users) {
  if (!users || users.length === 0) {
    usersEl.innerHTML = '<div class="empty">No users seen yet. Have teammates log in once, then reload.</div>';
    return;
  }

  const rows = users.map(u => {
    const avatar = u.avatar ? `<img src="${u.avatar}" alt="" class="users-avatar" />` : '';
    const lastSeen = u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : '—';

    const checked = u.deployAllowed === true ? 'checked' : '';
    const indeterminate = typeof u.deployAllowed !== 'boolean';
    const note = indeterminate ? '<span class="small">(default)</span>' : '';

    const removeDisabled = u.source === 'github' ? '' : '';

    return `
      <tr>
        <td class="users-user">${avatar}<span>${u.username}</span></td>
        <td class="small">${lastSeen}</td>
        <td>
          <label class="toggle">
            <input type="checkbox" data-username="${u.username}" ${checked} />
            <span class="small">Allow deploy</span>
            ${note}
          </label>
        </td>
        <td style="width: 1%; white-space: nowrap;">
          <button class="user-remove" data-remove="${u.username}" ${removeDisabled}>Remove</button>
        </td>
      </tr>
    `;
  }).join('');

  usersEl.innerHTML = `
    <table class="users-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Last seen</th>
          <th>Deploy permission</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  // Apply indeterminate UI state for default/undefined
  usersEl.querySelectorAll('input[type=checkbox][data-username]').forEach(cb => {
    const username = cb.getAttribute('data-username');
    const user = users.find(x => x.username === username);
    if (user && typeof user.deployAllowed !== 'boolean') {
      cb.indeterminate = true;
    }

    cb.addEventListener('change', async () => {
      const val = cb.checked;
      cb.indeterminate = false;
      cb.disabled = true;
      try {
        await updateUser(username, val);
        setStatus(`Updated ${username}: deployAllowed=${val}`);
      } catch (err) {
        setStatus('Error: ' + err.message);
        // revert visual state best-effort
        cb.checked = !val;
        cb.indeterminate = true;
      } finally {
        cb.disabled = false;
      }
    });

    cb.addEventListener('click', () => {
      // If it was indeterminate, clicking should make it checked (allowed)
      if (cb.indeterminate) {
        cb.indeterminate = false;
        cb.checked = true;
      }
    });
  });

  usersEl.querySelectorAll('button.user-remove[data-remove]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const username = btn.getAttribute('data-remove');
      if (!username) return;
      btn.disabled = true;
      try {
        await removeUser(username);
        setStatus(`Removed override for ${username}`);
        await load();
      } catch (err) {
        setStatus('Error: ' + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function load() {
  setStatus('Loading...');
  try {
    const me = await fetchMe();
    if (!me) return;

    userAvatarEl.src = me.avatar || '';
    userUsernameEl.textContent = me.username || '';

    const data = await fetchUsers();
    if (!data) return;

    render(data.users || []);
    setStatus('Loaded.');
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    usersEl.innerHTML = `
      <div class="error" style="text-align:left;">
        <div style="font-weight:600; margin-bottom:6px;">Cannot load users yet</div>
        <div class="small" style="margin-left:0; color:inherit;">${msg}</div>
        <div class="small" style="margin-left:0; margin-top:10px; color:inherit;">
          Fix:
          <ol style="margin:6px 0 0 18px;">
            <li>Go to <a href="/" class="header-link">Dashboard</a></li>
            <li>Fill <strong>Owner</strong> and <strong>Repo</strong>, then click <strong>Start</strong></li>
            <li>Come back here and click <strong>Reload</strong></li>
          </ol>
        </div>
        <div class="small" style="margin-left:0; margin-top:10px; color:inherit;">
          Notes: you must be <strong>repo admin</strong> to access this page. If you still only see yourself, GitHub may be blocking collaborator listing (org policy); in that case you’ll only see users who have logged in at least once.
        </div>
      </div>
    `;
    setStatus('Error: ' + msg);
  }
}

reloadBtn.addEventListener('click', load);
addBtnEl.addEventListener('click', async () => {
  const username = (addUsernameEl.value || '').trim();
  if (!username) {
    setStatus('Provide a GitHub username to add.');
    return;
  }
  addBtnEl.disabled = true;
  try {
    await addUser(username, !!addDeployEl.checked);
    addUsernameEl.value = '';
    addDeployEl.checked = false;
    setStatus(`Added ${username}`);
    await load();
  } catch (err) {
    setStatus('Error: ' + err.message);
  } finally {
    addBtnEl.disabled = false;
  }
});
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } finally {
    window.location.href = '/login';
  }
});

document.addEventListener('DOMContentLoaded', load);
