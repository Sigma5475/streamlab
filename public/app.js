series.seasons.forEach(season => {
  season.episodes.forEach(ep => {
    const card = document.createElement('div');
    card.className = 'card';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.innerHTML = `<img src="https://via.placeholder.com/400x225.png?text=${encodeURIComponent('Ep '+ep.episode)}"
      style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;

    const etitle = document.createElement('div');
    etitle.className = 'title';
    etitle.textContent = `Épisode ${ep.episode} — ${ep.title}`;

    const btnPlay = document.createElement('button');
    btnPlay.className = 'btn';
    btnPlay.textContent = '▶ Lecture';
    btnPlay.onclick = () => {
      openPlayer(series.title + ' S' + season.season + 'E' + ep.episode, ep.src);
    };

    card.appendChild(thumb);
    card.appendChild(etitle);
    card.appendChild(btnPlay);

    list.appendChild(card);
  });
});

  modal.appendChild(title);
  modal.appendChild(close);
  modal.appendChild(list);

  document.body.appendChild(modal);
}

function openPlayer(title, src){
  modalTitle.textContent = title;
  player.src = src;
  playerModal.classList.add('open');
  player.play();
}

closeBtn.onclick = () => {
  player.pause();
  playerModal.classList.remove('open');
  player.src = '';
};

// recherche simple
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  if(!q){ renderCatalog(catalog); return; }
  const filtered = {
    series: catalog.series.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.seasons.some(se => se.episodes.some(ep => ep.title.toLowerCase().includes(q)))
    )
  };
  renderCatalog(filtered);
});

loadCatalog();

