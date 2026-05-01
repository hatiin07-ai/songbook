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
