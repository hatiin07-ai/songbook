console.log('songs.js loaded');

function renderStars(level) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= level ? '\u2605' : '\u2606';
  }
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

    // hide loading
    if (loadingState) loadingState.style.display = 'none';

    if (error) throw error;
    if (!data || data.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    window._allSongs = data;

    // === DEBUG: 테이블 바깥에 데이터 직접 표시 ===
    const debugDiv = document.createElement('div');
    debugDiv.id = 'debugData';
    debugDiv.style.cssText = 'background:#ffe0e0; padding:20px; margin:20px; border-radius:12px; border:2px solid red;';
    debugDiv.innerHTML = '<h3 style="color:red; font-size:18px; margin-bottom:10px;">\ud83d\udea8 DEBUG: \ub370\uc774\ud130 \ud655\uc778 (' + data.length + '\uace1)</h3>' +
      data.map(song => 
        '<p style="color:#333; font-size:14px; padding:4px 0;">\u2022 <strong>' + escapeHtml(song.artist) + '</strong> - ' + escapeHtml(song.title) + ' ' + renderStars(song.level) + ' ' + escapeHtml(song.memo) + '</p>'
      ).join('');
    
    const main = document.querySelector('main');
    main.insertBefore(debugDiv, main.firstChild);

    // === 테이블도 렌더링 ===
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
  tbody.innerHTML = songs.map(song =>
    '<tr style="border-bottom:1px solid #F5D5D5; background:#fff;">' +
    '<td style="padding:12px 16px; color:#3D3D3D; font-weight:500;">' + escapeHtml(song.artist) + '</td>' +
    '<td style="padding:12px 16px; color:#3D3D3D;">' + escapeHtml(song.title) + '</td>' +
    '<td style="padding:12px 16px; text-align:center; color:#E87A7A;">' + renderStars(song.level) + '</td>' +
    '<td style="padding:12px 16px; color:#8C8C8C; font-size:0.8rem;">' + escapeHtml(song.memo) + '</td>' +
    '</tr>'
  ).join('');
}
