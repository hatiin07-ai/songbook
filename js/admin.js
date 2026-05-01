// ============================================
// \ud83d\udd10 Admin - \uad00\ub9ac\uc790 \ud398\uc774\uc9c0 \ub85c\uc9c1
// ============================================

let currentGenre = 'kpop';
let currentUser = null;
let adminSort = { key: 'artist', dir: 'asc' };
let adminSongsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  const sb = initSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    showAdminScreen();
  }

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.querySelectorAll('.genre-tab').forEach(tab => {
    tab.addEventListener('click', () => switchGenre(tab.dataset.genre));
  });
  document.getElementById('addSongForm').addEventListener('submit', handleAddSong);
  setupStarRating('inputStars', 'inputLevel');
  setupStarRating('editStars', 'editLevel');
  document.getElementById('editCancel').addEventListener('click', closeEditModal);
  document.getElementById('editForm').addEventListener('submit', handleEditSong);
});

async function handleLogin(e) {
  e.preventDefault();
  const sb = initSupabase();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.classList.add('hidden');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = '\ub85c\uadf8\uc778 \uc2e4\ud328: \uc774\uba54\uc77c \ub610\ub294 \ube44\ubc00\ubc88\ud638\ub97c \ud655\uc778\ud558\uc138\uc694';
    errorEl.classList.remove('hidden');
    return;
  }
  currentUser = data.user;
  showAdminScreen();
}

async function handleLogout() {
  const sb = initSupabase();
  await sb.auth.signOut();
  currentUser = null;
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminScreen').classList.add('hidden');
  showToast('\ub85c\uadf8\uc544\uc6c3 \ub418\uc5c8\uc2b5\ub2c8\ub2e4');
}

function showAdminScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminScreen').classList.remove('hidden');
  document.getElementById('userEmail').textContent = currentUser.email;
  loadAdminSongs();
}

function switchGenre(genre) {
  currentGenre = genre;
  document.querySelectorAll('.genre-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.genre === genre);
  });
  loadAdminSongs();
}

async function loadAdminSongs() {
  const sb = initSupabase();
  const tbody = document.getElementById('adminSongBody');
  const emptyEl = document.getElementById('adminEmpty');
  const loadingEl = document.getElementById('adminLoading');

  loadingEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  const { data, error } = await sb
    .from('songs')
    .select('*')
    .eq('genre', currentGenre)
    .order('artist', { ascending: true });

  loadingEl.classList.add('hidden');

  if (error || !data || data.length === 0) {
    tbody.innerHTML = '';
    adminSongsData = [];
    emptyEl.classList.remove('hidden');
    return;
  }

  adminSongsData = data;
  setupAdminSortHeaders();
  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminSongBody');
  const emptyEl = document.getElementById('adminEmpty');

  if (!adminSongsData || adminSongsData.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // 시그니처 먼저, 그 안에서 현재 정렬 적용
  const sorted = sortAdminSongs(adminSongsData);

  tbody.innerHTML = sorted.map(song => {
    const sigBg = song.is_signature ? 'background:#FFF0ED;' : '';
    const sigBadge = song.is_signature ? '<span style="background:#D4727A; color:#fff; font-size:0.65rem; padding:2px 6px; border-radius:8px; margin-left:4px;">🎀 시그니처</span>' : '';
    const sigBtnText = song.is_signature ? '☆ 해제' : '★ 시그니처';
    const sigBtnStyle = song.is_signature 
      ? 'background:#FFF0ED; color:#D4727A; border:1px solid #E8A0A0;'
      : 'background:#fff; color:#8C8C8C; border:1px solid #ddd;';
    
    return '<tr style="border-bottom:1px solid rgba(232,160,160,0.15); ' + sigBg + '">' +
      '<td style="padding:12px 16px; color:#3D3D3D; font-weight:500;">' + escapeHtml(song.artist) + sigBadge + '</td>' +
      '<td style="padding:12px 16px; color:#3D3D3D;">' + escapeHtml(song.title) + '</td>' +
      '<td style="padding:12px 16px; text-align:center;">' + renderStarsAdmin(song.level) + '</td>' +
      '<td style="padding:12px 16px; color:#8C8C8C; font-size:0.8rem;">' + escapeHtml(song.memo) + '</td>' +
      '<td style="padding:12px 16px; text-align:center;">' +
        '<div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">' +
          '<button style="' + sigBtnStyle + ' font-size:0.7rem; padding:3px 8px; border-radius:6px; cursor:pointer; white-space:nowrap;" onclick="toggleSignature(' + song.id + ', ' + !song.is_signature + ')">' + sigBtnText + '</button>' +
          '<button class="btn-edit" onclick="openEditModal(' + song.id + ', \'' + escapeAttr(song.artist) + '\', \'' + escapeAttr(song.title) + '\', ' + song.level + ', \'' + escapeAttr(song.memo) + '\', ' + (song.is_signature || false) + ')">수정</button>' +
          '<button class="btn-delete" onclick="deleteSong(' + song.id + ')">삭제</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// 어드민 정렬
function sortAdminSongs(songs) {
  const { key, dir } = adminSort;
  return [...songs].sort((a, b) => {
    // 시그니처 곡은 항상 최상단
    if (a.is_signature && !b.is_signature) return -1;
    if (!a.is_signature && b.is_signature) return 1;

    let valA = a[key], valB = b[key];
    if (key === 'level') {
      return dir === 'asc' ? valA - valB : valB - valA;
    }
    valA = (valA || '').toLowerCase();
    valB = (valB || '').toLowerCase();
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// 어드민 정렬 헤더 셋업
function setupAdminSortHeaders() {
  const headers = document.querySelectorAll('#adminScreen thead th');
  const sortKeys = ['artist', 'title', 'level', null, null]; // 메모, 관리는 정렬 없음

  headers.forEach((th, idx) => {
    const key = sortKeys[idx];
    if (!key) return;
    if (th.getAttribute('data-sort-key')) return; // 이미 셋업됨

    th.style.cursor = 'pointer';
    th.style.userSelect = 'none';
    th.setAttribute('data-sort-key', key);

    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.style.marginLeft = '4px';
    arrow.style.fontSize = '0.7rem';
    arrow.style.opacity = '0.4';
    arrow.textContent = '▲▼';
    th.appendChild(arrow);

    th.addEventListener('click', () => {
      if (adminSort.key === key) {
        adminSort.dir = adminSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        adminSort.key = key;
        adminSort.dir = 'asc';
      }
      updateAdminSortArrows();
      renderAdminTable();
    });
  });

  updateAdminSortArrows();
}

function updateAdminSortArrows() {
  document.querySelectorAll('#adminScreen thead th[data-sort-key]').forEach(th => {
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    const key = th.getAttribute('data-sort-key');
    if (key === adminSort.key) {
      arrow.style.opacity = '1';
      arrow.textContent = adminSort.dir === 'asc' ? '▲' : '▼';
    } else {
      arrow.style.opacity = '0.4';
      arrow.textContent = '▲▼';
    }
  });
}

// \uc2dc\uadf8\ub2c8\ucc98 \ud1a0\uae00
async function toggleSignature(id, value) {
  const sb = initSupabase();
  const { error } = await sb.from('songs').update({ is_signature: value }).eq('id', id);
  if (error) {
    showToast('\uc2e4\ud328: ' + error.message);
    return;
  }
  showToast(value ? '\ud83c\udf80 \uc2dc\uadf8\ub2c8\ucc98 \uace1\uc73c\ub85c \uc124\uc815!' : '\uc2dc\uadf8\ub2c8\ucc98 \ud574\uc81c');
  loadAdminSongs();
}

async function handleAddSong(e) {
  e.preventDefault();
  const sb = initSupabase();
  const isSignature = document.getElementById('inputSignature')?.checked || false;

  const song = {
    genre: currentGenre,
    artist: document.getElementById('inputArtist').value.trim(),
    title: document.getElementById('inputTitle').value.trim(),
    level: parseInt(document.getElementById('inputLevel').value),
    memo: document.getElementById('inputMemo').value.trim(),
    is_signature: isSignature
  };

  const { error } = await sb.from('songs').insert([song]);
  if (error) { showToast('\ucd94\uac00 \uc2e4\ud328: ' + error.message); return; }

  document.getElementById('addSongForm').reset();
  document.getElementById('inputLevel').value = '0';
  if (document.getElementById('inputSignature')) document.getElementById('inputSignature').checked = false;
  resetStars('inputStars');
  showToast('\u2705 \ub178\ub798\uac00 \ucd94\uac00\ub418\uc5c8\uc2b5\ub2c8\ub2e4');
  loadAdminSongs();
}

function openEditModal(id, artist, title, level, memo, isSignature) {
  document.getElementById('editId').value = id;
  document.getElementById('editArtist').value = artist;
  document.getElementById('editTitle').value = title;
  document.getElementById('editLevel').value = level;
  document.getElementById('editMemo').value = memo;
  if (document.getElementById('editSignature')) {
    document.getElementById('editSignature').checked = isSignature || false;
  }
  setStars('editStars', level);
  document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
}

async function handleEditSong(e) {
  e.preventDefault();
  const sb = initSupabase();
  const id = document.getElementById('editId').value;
  const isSignature = document.getElementById('editSignature')?.checked || false;

  const updates = {
    artist: document.getElementById('editArtist').value.trim(),
    title: document.getElementById('editTitle').value.trim(),
    level: parseInt(document.getElementById('editLevel').value),
    memo: document.getElementById('editMemo').value.trim(),
    is_signature: isSignature
  };

  const { error } = await sb.from('songs').update(updates).eq('id', id);
  if (error) { showToast('\uc218\uc815 \uc2e4\ud328: ' + error.message); return; }
  closeEditModal();
  showToast('\u2705 \ub178\ub798\uac00 \uc218\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4');
  loadAdminSongs();
}

async function deleteSong(id) {
  if (!confirm('\uc815\ub9d0 \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) return;
  const sb = initSupabase();
  const { error } = await sb.from('songs').delete().eq('id', id);
  if (error) { showToast('\uc0ad\uc81c \uc2e4\ud328: ' + error.message); return; }
  showToast('\ud83d\uddd1\ufe0f \uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4');
  loadAdminSongs();
}

// \ubcc4\uc810 UI
function setupStarRating(containerId, hiddenInputId) {
  const container = document.getElementById(containerId);
  const stars = container.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      document.getElementById(hiddenInputId).value = value;
      setStars(containerId, value);
    });
    star.addEventListener('mouseenter', () => {
      highlightStars(containerId, parseInt(star.dataset.value));
    });
  });
  container.addEventListener('mouseleave', () => {
    setStars(containerId, parseInt(document.getElementById(hiddenInputId).value));
  });
}

function setStars(containerId, value) {
  document.getElementById(containerId).querySelectorAll('.star').forEach(star => {
    const v = parseInt(star.dataset.value);
    star.style.color = v <= value ? '#E87A7A' : '#E0D6D6';
  });
}

function highlightStars(containerId, value) {
  document.getElementById(containerId).querySelectorAll('.star').forEach(star => {
    star.style.color = parseInt(star.dataset.value) <= value ? '#E87A7A' : '#E0D6D6';
  });
}

function resetStars(containerId) {
  document.getElementById(containerId).querySelectorAll('.star').forEach(star => {
    star.style.color = '#E0D6D6';
  });
}

function renderStarsAdmin(level) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= level ? '<span style="color:#E87A7A">\u2605</span>' : '<span style="color:#E0D6D6">\u2605</span>';
  }
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function escapeAttr(text) {
  return (text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
