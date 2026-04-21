// ============================================
// 🎵 Songs - 공개 페이지 로직
// ============================================

function renderStars(level) {
  let html = '<span style="letter-spacing:2px; font-size:0.875rem;">';
  for (let i = 1; i <= 5; i++) {
    html += i <= level 
      ? '<span style="color:#E87A7A">\u2605</span>' 
      : '<span style="color:#E0D6D6">\u2605</span>';
  }
  html += '</span>';
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
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

    window._allSongs = data;
    renderSongTable(data);

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) { renderSongTable(window._allSongs); return; }
      const filtered = window._allSongs.filter(song =>
        song.artist.toLowerCase().includes(query) || song.title.toLowerCase().includes(query)
      );
      renderSongTable(filtered);
    });

  } catch (err) {
    console.error('Error:', err);
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  }
}

function renderSongTable(songs) {
  const tbody = document.getElementById('songTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!songs || songs.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  tbody.innerHTML = songs.map((song, i) =>
    '<tr style="border-bottom:1px solid rgba(232,160,160,0.15); background:' + (i % 2 === 0 ? '#ffffff' : '#FFF8F6') + ';">' +
    '<td style="padding:12px 16px; color:#3D3D3D; font-weight:500;">' + escapeHtml(song.artist) + '</td>' +
    '<td style="padding:12px 16px; color:#3D3D3D;">' + escapeHtml(song.title) + '</td>' +
    '<td style="padding:12px 16px; text-align:center;">' + renderStars(song.level) + '</td>' +
    '<td style="padding:12px 16px; color:#8C8C8C; font-size:0.8rem;">' + escapeHtml(song.memo) + '</td>' +
    '</tr>'
  ).join('');
}
