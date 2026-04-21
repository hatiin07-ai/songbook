// ============================================
// 🎵 Songs - 공개 페이지 로직
// ============================================

// 별점 HTML 생성
function renderStars(level) {
  let html = '<span class="star-display">';
  for (let i = 1; i <= 5; i++) {
    html += i <= level 
      ? '<span class="star-on">★</span>' 
      : '<span class="star-off">★</span>';
  }
  html += '</span>';
  return html;
}

// 텍스트 이스케이프 (XSS 방지)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// 노래 목록 로드
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

    loadingState.classList.add('hidden');

    if (error) throw error;

    if (!data || data.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    // 전체 데이터 저장 (검색용)
    window._allSongs = data;
    renderSongTable(data);

    // 검색 기능
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderSongTable(window._allSongs);
        return;
      }
      const filtered = window._allSongs.filter(song =>
        song.artist.toLowerCase().includes(query) ||
        song.title.toLowerCase().includes(query)
      );
      renderSongTable(filtered);
    });

  } catch (err) {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    console.error('노래 로드 실패:', err);
  }
}

// 테이블 렌더링
function renderSongTable(songs) {
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!songs || songs.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tbody.innerHTML = songs.map(song => `
    <tr class="border-b border-point/10">
      <td class="px-4 py-3 text-txt font-medium">${escapeHtml(song.artist)}</td>
      <td class="px-4 py-3 text-txt">${escapeHtml(song.title)}</td>
      <td class="px-4 py-3 text-center">${renderStars(song.level)}</td>
      <td class="px-4 py-3 text-sub text-xs">${escapeHtml(song.memo)}</td>
    </tr>
  `).join('');
}
