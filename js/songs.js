// ============================================
// 🎵 Songs - 공개 페이지 로직
// ============================================

console.log('🎵 songs.js 로드됨');

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

async function loadSongs(genre) {
  console.log('📡 loadSongs 호출됨, genre:', genre);
  
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

    console.log('📦 응답 data:', data);
    console.log('❌ 응답 error:', error);

    loadingState.style.display = 'none';

    if (error) throw error;

    if (!data || data.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    console.log('🎵 노래 수:', data.length);
    window._allSongs = data;
    renderSongTable(data);

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
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
  }
}

function renderSongTable(songs) {
  console.log('🖥️ renderSongTable 호출, songs:', songs?.length);
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!songs || songs.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  
  const rows = songs.map(song => 
    '<tr style="border-bottom:1px solid #F5D5D5;">' +
      '<td style="padding:12px 16px; color:#3D3D3D; font-weight:500;">' + escapeHtml(song.artist) + '</td>' +
      '<td style="padding:12px 16px; color:#3D3D3D;">' + escapeHtml(song.title) + '</td>' +
      '<td style="padding:12px 16px; text-align:center;">' + renderStars(song.level) + '</td>' +
      '<td style="padding:12px 16px; color:#8C8C8C; font-size:0.8rem;">' + escapeHtml(song.memo) + '</td>' +
    '</tr>'
  ).join('');
  
  tbody.innerHTML = rows;
  console.log('✅ tbody.innerHTML 설정 완료, children:', tbody.children.length);
}
