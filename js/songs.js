// ============================================
// 🎵 Songs - 공개 페이지 로직
// ============================================

console.log('🎵 songs.js 로드됨');

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
  console.log('📡 loadSongs 호출됨, genre:', genre);
  
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const searchInput = document.getElementById('searchInput');
  
  try {
    console.log('🔌 Supabase 초기화 중...');
    const sb = initSupabase();
    console.log('✅ Supabase 클라이언트 생성됨');
    
    console.log('📥 데이터 요청 중...');
    const { data, error } = await sb
      .from('songs')
      .select('*')
      .eq('genre', genre)
      .order('artist', { ascending: true });

    console.log('📦 응답 data:', data);
    console.log('❌ 응답 error:', error);

    loadingState.classList.add('hidden');

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('⚠️ 데이터 없음');
      emptyState.classList.remove('hidden');
      return;
    }

    console.log('🎵 노래 수:', data.length);
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
    console.error('🚨 에러 발생:', err);
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }
}

// 테이블 렌더링
function renderSongTable(songs) {
  console.log('🖥️ renderSongTable 호출, songs:', songs?.length);
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
