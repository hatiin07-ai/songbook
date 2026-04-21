// ============================================
// 🔐 Admin - 관리자 페이지 로직
// ============================================

let currentGenre = 'kpop';
let currentUser = null;

// ---- 초기화 ----
document.addEventListener('DOMContentLoaded', async () => {
  const sb = initSupabase();

  // 세션 확인
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    showAdminScreen();
  }

  // 로그인 폼
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // 로그아웃
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 장르 탭
  document.querySelectorAll('.genre-tab').forEach(tab => {
    tab.addEventListener('click', () => switchGenre(tab.dataset.genre));
  });

  // 노래 추가 폼
  document.getElementById('addSongForm').addEventListener('submit', handleAddSong);

  // 별점 (추가 폼)
  setupStarRating('inputStars', 'inputLevel');

  // 별점 (수정 모달)
  setupStarRating('editStars', 'editLevel');

  // 수정 모달 닫기
  document.getElementById('editCancel').addEventListener('click', closeEditModal);

  // 수정 폼
  document.getElementById('editForm').addEventListener('submit', handleEditSong);
});

// ---- 로그인 ----
async function handleLogin(e) {
  e.preventDefault();
  const sb = initSupabase();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  errorEl.classList.add('hidden');

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = '로그인 실패: 이메일 또는 비밀번호를 확인하세요';
    errorEl.classList.remove('hidden');
    return;
  }

  currentUser = data.user;
  showAdminScreen();
}

// ---- 로그아웃 ----
async function handleLogout() {
  const sb = initSupabase();
  await sb.auth.signOut();
  currentUser = null;
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminScreen').classList.add('hidden');
  showToast('로그아웃 되었습니다');
}

// ---- Admin 화면 표시 ----
function showAdminScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminScreen').classList.remove('hidden');
  document.getElementById('userEmail').textContent = currentUser.email;
  loadAdminSongs();
}

// ---- 장르 전환 ----
function switchGenre(genre) {
  currentGenre = genre;
  document.querySelectorAll('.genre-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.genre === genre);
  });
  loadAdminSongs();
}

// ---- 노래 목록 로드 (Admin) ----
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
    emptyEl.classList.remove('hidden');
    return;
  }

  tbody.innerHTML = data.map(song => `
    <tr class="border-b border-point/10">
      <td class="px-4 py-3 text-txt font-medium">${escapeHtml(song.artist)}</td>
      <td class="px-4 py-3 text-txt">${escapeHtml(song.title)}</td>
      <td class="px-4 py-3 text-center">${renderStarsAdmin(song.level)}</td>
      <td class="px-4 py-3 text-sub text-xs">${escapeHtml(song.memo)}</td>
      <td class="px-4 py-3 text-center">
        <div class="flex gap-1 justify-center">
          <button class="btn-edit" onclick="openEditModal(${song.id}, '${escapeAttr(song.artist)}', '${escapeAttr(song.title)}', ${song.level}, '${escapeAttr(song.memo)}')">수정</button>
          <button class="btn-delete" onclick="deleteSong(${song.id})">삭제</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- 노래 추가 ----
async function handleAddSong(e) {
  e.preventDefault();
  const sb = initSupabase();

  const song = {
    genre: currentGenre,
    artist: document.getElementById('inputArtist').value.trim(),
    title: document.getElementById('inputTitle').value.trim(),
    level: parseInt(document.getElementById('inputLevel').value),
    memo: document.getElementById('inputMemo').value.trim()
  };

  const { error } = await sb.from('songs').insert([song]);

  if (error) {
    showToast('추가 실패: ' + error.message);
    return;
  }

  // 폼 리셋
  document.getElementById('addSongForm').reset();
  document.getElementById('inputLevel').value = '0';
  resetStars('inputStars');
  
  showToast('✅ 노래가 추가되었습니다');
  loadAdminSongs();
}

// ---- 수정 모달 ----
function openEditModal(id, artist, title, level, memo) {
  document.getElementById('editId').value = id;
  document.getElementById('editArtist').value = artist;
  document.getElementById('editTitle').value = title;
  document.getElementById('editLevel').value = level;
  document.getElementById('editMemo').value = memo;
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

  const updates = {
    artist: document.getElementById('editArtist').value.trim(),
    title: document.getElementById('editTitle').value.trim(),
    level: parseInt(document.getElementById('editLevel').value),
    memo: document.getElementById('editMemo').value.trim()
  };

  const { error } = await sb.from('songs').update(updates).eq('id', id);

  if (error) {
    showToast('수정 실패: ' + error.message);
    return;
  }

  closeEditModal();
  showToast('✅ 노래가 수정되었습니다');
  loadAdminSongs();
}

// ---- 노래 삭제 ----
async function deleteSong(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const sb = initSupabase();
  const { error } = await sb.from('songs').delete().eq('id', id);

  if (error) {
    showToast('삭제 실패: ' + error.message);
    return;
  }

  showToast('🗑️ 삭제되었습니다');
  loadAdminSongs();
}

// ---- 별점 UI ----
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
      const value = parseInt(star.dataset.value);
      highlightStars(containerId, value);
    });
  });

  container.addEventListener('mouseleave', () => {
    const current = parseInt(document.getElementById(hiddenInputId).value);
    setStars(containerId, current);
  });
}

function setStars(containerId, value) {
  const stars = document.getElementById(containerId).querySelectorAll('.star');
  stars.forEach(star => {
    const v = parseInt(star.dataset.value);
    star.classList.toggle('active', v <= value);
    star.style.color = v <= value ? '#E87A7A' : '#E0D6D6';
  });
}

function highlightStars(containerId, value) {
  const stars = document.getElementById(containerId).querySelectorAll('.star');
  stars.forEach(star => {
    const v = parseInt(star.dataset.value);
    star.style.color = v <= value ? '#E87A7A' : '#E0D6D6';
  });
}

function resetStars(containerId) {
  const stars = document.getElementById(containerId).querySelectorAll('.star');
  stars.forEach(star => {
    star.classList.remove('active');
    star.style.color = '#E0D6D6';
  });
}

// ---- 유틸리티 ----
function renderStarsAdmin(level) {
  let html = '<span class="star-display">';
  for (let i = 1; i <= 5; i++) {
    html += i <= level ? '<span class="star-on">★</span>' : '<span class="star-off">★</span>';
  }
  html += '</span>';
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
