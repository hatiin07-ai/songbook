// ============================================
// 🎵 Songs - 공개 페이지 로직
// ============================================

// 정렬 상태
let currentSort = { key: 'artist', dir: 'asc' };

function renderStars(level) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= level 
      ? '<span style="color:#E87A7A">★</span>' 
      : '<span style="color:#E0D6D6">★</span>';
  }
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// 시그니처 카드 렌더링 (가로 행 리스트)
function renderSignatureCards(songs) {
  const section = document.getElementById('signatureSection');
  if (!section || !songs || songs.length === 0) return;

  section.style.display = 'block';
  section.className = 'mb-6';
  section.innerHTML = 
    '<div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">' +
      '<span style="font-size:1.1rem;">🎀</span>' +
      '<span style="font-weight:700; color:#3D3D3D; font-size:0.95rem;">시그니처 곡</span>' +
    '</div>' +
    '<div style="display:flex; flex-direction:column; gap:8px;">' +
    songs.map(song =>
      '<div style="background:linear-gradient(135deg, #FFF0ED 0%, #FFF8F6 100%); border:1.5px solid #E8A0A0; border-radius:12px; padding:12px 20px; display:flex; align-items:center; gap:16px; position:relative; overflow:hidden;">' +
        '<div style="position:absolute; top:-8px; right:-8px; font-size:2.5rem; opacity:0.06;">🎵</div>' +
        '<div style="font-weight:700; color:#D4727A; font-size:0.85rem; min-width:100px;">' + escapeHtml(song.artist) + '</div>' +
        '<div style="font-weight:600; color:#3D3D3D; font-size:0.95rem; flex:1;">' + escapeHtml(song.title) + '</div>' +
        '<div style="letter-spacing:2px; font-size:0.8rem; min-width:90px; text-align:center;">' + renderStars(song.level) + '</div>' +
        (song.memo ? '<div style="color:#8C8C8C; font-size:0.75rem; min-width:80px;">' + escapeHtml(song.memo) + '</div>' : '') +
      '</div>'
    ).join('') +
    '</div>';
}

async function loadSongs(genre) {
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const searchInput = document.getElementById('searchInput');
  
  try {
    const sb = initSupabase();
    const { data, error } = await sb
      .from('songs')
      .select('*')
      .eq('genre', genre)
      .order('artist', { ascending: true });

    if (loadingState) loadingState.style.display = 'none';
    if (error) throw error;

    if (!data || data.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    // 시그니처 곡 분리
    const signatureSongs = data.filter(s => s.is_signature === true);

    // 시그니처 카드 렌더링
    renderSignatureCards(signatureSongs);

    // 전체 데이터 저장 (검색용 - 시그니처 포함 전체)
    window._allSongs = data;
    renderSongTable(data);

    // 정렬 헤더 초기화
    setupSortHeaders();

    // 랜덤뽑기 버튼 추가
    setupRandomButton();

    // 검색 기능
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) { renderSongTable(sortSongs(window._allSongs)); return; }
      const filtered = window._allSongs.filter(song =>
        song.artist.toLowerCase().includes(query) || song.title.toLowerCase().includes(query)
      );
      renderSongTable(sortSongs(filtered));
    });

  } catch (err) {
    console.error('Error:', err);
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  }
}

// 정렬 헤더 셋업
function setupSortHeaders() {
  const headers = document.querySelectorAll('thead th');
  const sortKeys = ['artist', 'title', 'level', null]; // 메모는 정렬 없음

  headers.forEach((th, idx) => {
    const key = sortKeys[idx];
    if (!key) return;

    th.style.cursor = 'pointer';
    th.style.userSelect = 'none';
    th.setAttribute('data-sort-key', key);

    // 화살표 추가
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.style.marginLeft = '4px';
    arrow.style.fontSize = '0.7rem';
    arrow.style.opacity = '0.4';
    arrow.textContent = '▲▼';
    th.appendChild(arrow);

    th.addEventListener('click', () => {
      if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.dir = 'asc';
      }
      updateSortArrows();
      applySort();
    });
  });

  updateSortArrows();
}

// 화살표 표시 업데이트
function updateSortArrows() {
  document.querySelectorAll('thead th[data-sort-key]').forEach(th => {
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    const key = th.getAttribute('data-sort-key');
    if (key === currentSort.key) {
      arrow.style.opacity = '1';
      arrow.textContent = currentSort.dir === 'asc' ? '▲' : '▼';
    } else {
      arrow.style.opacity = '0.4';
      arrow.textContent = '▲▼';
    }
  });
}

// 정렬 적용
function sortSongs(songs) {
  const { key, dir } = currentSort;
  return [...songs].sort((a, b) => {
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

function applySort() {
  const searchInput = document.getElementById('searchInput');
  const query = (searchInput?.value || '').toLowerCase().trim();
  let songs = window._allSongs || [];
  if (query) {
    songs = songs.filter(song =>
      song.artist.toLowerCase().includes(query) || song.title.toLowerCase().includes(query)
    );
  }
  renderSongTable(sortSongs(songs));
}

function renderSongTable(songs) {
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!songs || songs.length === 0) {
    tbody.innerHTML = '';
    // 시그니처 곡이 있으면 empty state 안 보여줌
    const hasSig = document.getElementById('signatureSection')?.style.display === 'block';
    if (emptyState && !hasSig) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = songs.map((song, i) => {
    const sigBadge = song.is_signature ? ' <span style="background:#F5D5D5; color:#D4727A; font-size:0.6rem; padding:1px 6px; border-radius:8px; margin-left:4px; vertical-align:middle;">🎀</span>' : '';
    return '<tr style="border-bottom:1px solid rgba(232,160,160,0.15); background:' + (i % 2 === 0 ? '#ffffff' : '#FFF8F6') + ';">' +
    '<td style="padding:12px 16px; color:#3D3D3D; font-weight:500;">' + escapeHtml(song.artist) + sigBadge + '</td>' +
    '<td style="padding:12px 16px; color:#3D3D3D;">' + escapeHtml(song.title) + '</td>' +
    '<td style="padding:12px 16px; text-align:center; letter-spacing:2px;">' + renderStars(song.level) + '</td>' +
    '<td style="padding:12px 16px; color:#8C8C8C; font-size:0.8rem;">' + escapeHtml(song.memo) + '</td>' +
    '</tr>';
  }).join('');
}

// 랜덤뽑기 버튼 셋업
function setupRandomButton() {
  const searchContainer = document.getElementById('searchInput')?.parentElement;
  if (!searchContainer || document.getElementById('randomBtn')) return;

  // 검색창과 버튼을 나란히 배치
  searchContainer.style.display = 'flex';
  searchContainer.style.alignItems = 'center';
  searchContainer.style.gap = '8px';

  const btn = document.createElement('button');
  btn.id = 'randomBtn';
  btn.textContent = '🎲 랜덤뽑기';
  btn.style.cssText = 'padding:9px 16px; background:#D4727A; color:#fff; border:none; border-radius:12px; font-size:0.85rem; font-weight:600; cursor:pointer; white-space:nowrap; transition:background 0.2s;';
  btn.addEventListener('mouseenter', () => btn.style.background = '#c4616a');
  btn.addEventListener('mouseleave', () => btn.style.background = '#D4727A');
  btn.addEventListener('click', showRandomPick);
  searchContainer.appendChild(btn);
}

// 랜덤뽑기 팝업
function showRandomPick() {
  const songs = window._allSongs;
  if (!songs || songs.length === 0) return;

  const song = songs[Math.floor(Math.random() * songs.length)];

  // 기존 팝업 제거
  const old = document.getElementById('randomModal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'randomModal';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:9999; animation:fadeIn 0.2s ease;';

  const card = document.createElement('div');
  card.style.cssText = 'background:#fff; border-radius:20px; padding:32px 36px; max-width:360px; width:90%; text-align:center; position:relative; box-shadow:0 20px 60px rgba(0,0,0,0.15); animation:popIn 0.3s ease;';

  card.innerHTML =
    '<div style="font-size:2.5rem; margin-bottom:12px;">🎵</div>' +
    '<div style="font-size:0.8rem; color:#D4727A; font-weight:700; margin-bottom:4px;">' + escapeHtml(song.artist) + '</div>' +
    '<div style="font-size:1.2rem; color:#3D3D3D; font-weight:700; margin-bottom:12px;">' + escapeHtml(song.title) + '</div>' +
    '<div style="letter-spacing:3px; margin-bottom:20px;">' + renderStars(song.level) + '</div>' +
    '<div style="display:flex; gap:8px; justify-content:center;">' +
      '<button id="randomAgainBtn" style="padding:8px 20px; background:#FFF0ED; color:#D4727A; border:1.5px solid #E8A0A0; border-radius:10px; font-size:0.8rem; font-weight:600; cursor:pointer;">🎲 다시 뽑기</button>' +
      '<button id="randomCloseBtn" style="padding:8px 20px; background:#f5f5f5; color:#8C8C8C; border:1px solid #ddd; border-radius:10px; font-size:0.8rem; font-weight:600; cursor:pointer;">닫기</button>' +
    '</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // 팝업 애니메이션 스타일 삽입
  if (!document.getElementById('randomModalStyle')) {
    const style = document.createElement('style');
    style.id = 'randomModalStyle';
    style.textContent =
      '@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }' +
      '@keyframes popIn { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:scale(1) } }';
    document.head.appendChild(style);
  }

  document.getElementById('randomAgainBtn').addEventListener('click', () => {
    overlay.remove();
    showRandomPick();
  });
  document.getElementById('randomCloseBtn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
