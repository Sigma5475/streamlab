function renderSeriesPage(seriesId) {
  const series = catalog.series.find(s => s.id === seriesId);
  if (!series) {
    seriesContainer.innerHTML = "<div>Série introuvable.</div>";
    return;
  }

  // Récupère la progression
  const progress = JSON.parse(localStorage.getItem('progress_' + seriesId) || '{}');

  let html = `
    <div class="serie-info">
      <img src="${series.image}" alt="${series.title}" style="width:300px;border-radius:12px;">
      <h2>${series.title}</h2>
      <p>${series.description}</p>
      <button id="btnContinue">${progress.episode ? 'Continuer lecture' : 'Commencer lecture'}</button>
      <h3>Choisir un épisode :</h3>
      <ul>
  `;
  series.seasons.forEach(season => {
    season.episodes.forEach(ep => {
      html += `<li>
        S${season.season}E${ep.episode} - ${ep.title}
        <button onclick="startEpisode('${series.id}',${season.season},${ep.episode})">Lecture</button>
      </li>`;
    });
  });
  html += `</ul></div>`;
  seriesContainer.innerHTML = html;

  // Gestion du bouton "Continuer"
  document.getElementById('btnContinue').onclick = () => {
    if (progress.episode) {
      startEpisode(series.id, progress.season, progress.episode, progress.time);
    } else {
      const firstSeason = series.seasons[0];
      const firstEpisode = firstSeason.episodes[0];
      startEpisode(series.id, firstSeason.season, firstEpisode.episode);
    }
  };
}

// Fonction pour lancer un épisode et sauvegarder la progression
function startEpisode(seriesId, seasonNumber, episodeNumber, startTime = 0) {
  const series = catalog.series.find(s => s.id === seriesId);
  const season = series.seasons.find(se => se.season === seasonNumber);
  const episode = season.episodes.find(e => e.episode === episodeNumber);

  openPlayer(series.title + ` S${seasonNumber}E${episodeNumber}`, episode.src, startTime);

  // Sauvegarde la progression
  localStorage.setItem('progress_' + seriesId, JSON.stringify({
    season: seasonNumber,
    episode: episodeNumber,
    time: 0
  }));
}

// Adapte openPlayer pour gérer le startTime
function openPlayer(title, src, startTime = 0) {
  modalTitle.textContent = title;
  player.src = src;
  playerModal.classList.add('open');
  player.currentTime = startTime;
  player.play();

  // Lecture automatique du prochain épisode
  player.onended = () => {
    // Trouver et lancer l'épisode suivant...
    // TODO: logiques pour trouver l'épisode suivant
  };
}
