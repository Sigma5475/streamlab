const seriesContainer = document.getElementById('seriesContainer');
const searchInput = document.getElementById('search');
const modalTitle = document.getElementById('modalTitle');
const playerModal = document.getElementById('playerModal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');

let backBtn;
function ensureBackBtn() {
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.className = 'btn back-btn';
    backBtn.textContent = 'Retour au menu';
    backBtn.onclick = () => {
      saveProgressOnExit();
      playerModal.classList.remove('open');
      player.pause();
      player.src = '';
      window.location.hash = '';
      renderPage();
    };
    const modalHead = playerModal.querySelector('.modal-head') || playerModal;
    modalHead.appendChild(backBtn);
  }
}

let catalog = { series: [] };

function navigateTo(hash) {
  window.location.hash = hash;
  renderPage();
}

function renderPage() {
  const hash = window.location.hash;
  if (hash.startsWith('#serie=')) {
    const serieId = hash.replace('#serie=', '');
    renderSeriesPage(serieId);
  } else {
    renderCatalog(catalog);
  }
}

function renderCatalog(data) {
  seriesContainer.innerHTML = '';
  if (!data.series || data.series.length === 0) {
    seriesContainer.innerHTML = '<div>Aucune série trouvée.</div>';
    return;
  }
  data.series.forEach(series => {
    const card = document.createElement('div');
    card.className = 'card serie-card';
    card.style.cursor = 'pointer';

    if (series.image) {
      const img = document.createElement('img');
      img.src = series.image;
      img.alt = series.title;
      img.style = "width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:8px";
      card.appendChild(img);
    }

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = series.title;
    card.appendChild(title);

    if (series.description) {
      const desc = document.createElement('div');
      desc.className = 'meta';
      desc.textContent = series.description.slice(0, 80) + (series.description.length > 80 ? '...' : '');
      card.appendChild(desc);
    }

    const progress = JSON.parse(localStorage.getItem('progress_' + series.id) || '{}');
    if (progress.episode) {
      const progDiv = document.createElement('div');
      progDiv.className = 'meta';
      progDiv.textContent = `En cours : S${progress.season}E${progress.episode} (${progress.time ? Math.floor(progress.time / 60) + ' min' : ''})`;
      card.appendChild(progDiv);
    }

    card.onclick = () => navigateTo('#serie=' + series.id);

    seriesContainer.appendChild(card);
  });
}

function renderSeriesPage(seriesId) {
  const series = catalog.series.find(s => s.id === seriesId);
  if (!series) {
    seriesContainer.innerHTML = "<div>Série introuvable.</div>";
    return;
  }
  const progress = JSON.parse(localStorage.getItem('progress_' + seriesId) || '{}');

  // Bouton retour au menu
  const backBtnSerie = document.createElement('button');
  backBtnSerie.className = 'btn back-btn';
  backBtnSerie.textContent = 'Retour au menu';
  backBtnSerie.onclick = () => {
    window.location.hash = '';
    renderPage();
  };

  let html = `
    <div class="serie-info">
      ${series.image ? `<img src="${series.image}" alt="${series.title}" style="width:300px;border-radius:12px;margin-bottom:16px;">` : ''}
      <h2>${series.title}</h2>
      <p>${series.description || ''}</p>
      <button id="btnContinue" class="btn" style="margin-bottom:14px">
        ${progress.episode ? 'Continuer la lecture' : 'Commencer la série'}
      </button>
      <h3>Choisir un épisode :</h3>
      <div class="episode-list">
  `;
  series.seasons.forEach(season => {
    html += `<div class="meta" style="font-weight:bold;color:var(--muted);margin-top:8px;">Saison ${season.season}</div>`;
    season.episodes.forEach(ep => {
      const isCurrent = progress.episode === ep.episode && progress.season === season.season;
      html += `<div class="episode-card">
        <span>S${season.season}E${ep.episode} - ${ep.title}</span>
        <div>
          <button class="btn" onclick="startEpisode('${series.id}',${season.season},${ep.episode},0)">Lecture</button>
          ${isCurrent && progress.time ?
            `<button class="btn" style="margin-left:10px;background:#444;color:#fff;" onclick="startEpisode('${series.id}',${season.season},${ep.episode},${progress.time})">
              Reprendre à ${Math.floor(progress.time/60)} min
            </button>` : ''}
        </div>
      </div>`;
    });
  });
  html += `</div></div>`;
  seriesContainer.innerHTML = '';
  seriesContainer.appendChild(backBtnSerie);
  seriesContainer.insertAdjacentHTML('beforeend', html);

  document.getElementById('btnContinue').onclick = () => {
    if (progress.episode) {
      startEpisode(series.id, progress.season, progress.episode, progress.time || 0);
    } else {
      const firstSeason = series.seasons[0];
      const firstEpisode = firstSeason.episodes[0];
      startEpisode(series.id, firstSeason.season, firstEpisode.episode, 0);
    }
  };
}

// Sauvegarde la progression pour l'épisode courant
function saveProgress(isEnd = false) {
  const seriesId = player.getAttribute('data-series');
  const season = Number(player.getAttribute('data-season'));
  const episode = Number(player.getAttribute('data-episode'));
  let time = player.currentTime;
  // Si épisode terminé, remet à zéro
  if (isEnd) {
    time = 0;
  }
  if (seriesId && season && episode) {
    localStorage.setItem('progress_' + seriesId, JSON.stringify({
      season,
      episode,
      time
    }));
  }
}

// Supprime la progression de l'ancien épisode si tu passes au suivant
function clearProgress(seriesId, seasonNumber, episodeNumber) {
  const progress = JSON.parse(localStorage.getItem('progress_' + seriesId) || '{}');
  if (progress.season !== seasonNumber || progress.episode !== episodeNumber) {
    localStorage.removeItem('progress_' + seriesId);
  }
}

// Démarrer un épisode
function startEpisode(seriesId, seasonNumber, episodeNumber, startTime = 0) {
  clearProgress(seriesId, seasonNumber, episodeNumber); // Efface la progression si épisode/saison changés
  const series = catalog.series.find(s => s.id === seriesId);
  const season = series.seasons.find(se => se.season === seasonNumber);
  const episode = season.episodes.find(e => e.episode === episodeNumber);

  openPlayer(series, season, episode, startTime);

  localStorage.setItem('progress_' + seriesId, JSON.stringify({
    season: seasonNumber,
    episode: episodeNumber,
    time: startTime
  }));

  player.setAttribute('data-series', seriesId);
  player.setAttribute('data-season', seasonNumber);
  player.setAttribute('data-episode', episodeNumber);
}

function openPlayer(series, season, episode, startTime = 0) {
  modalTitle.textContent = `${series.title} S${season.season}E${episode.episode} - ${episode.title}`;
  player.src = episode.src;
  playerModal.classList.add('open');

  player.onloadedmetadata = () => {
    player.currentTime = startTime || 0;
    player.play();
  };
  if (player.readyState > 0) {
    player.currentTime = startTime || 0;
    player.play();
  }

  ensureBackBtn();

  player.ontimeupdate = () => { saveProgress(); };
  player.onpause = () => { saveProgress(); };
  player.onended = () => {
    saveProgress(true);
    const next = findNextEpisode(series, season.season, episode.episode);
    if (next) {
      startEpisode(series.id, next.season, next.episode, 0);
    } else {
      playerModal.classList.remove('open');
      alert("Bravo, vous avez terminé la série !");
    }
  };
}

function saveProgressOnExit() {
  if (!playerModal.classList.contains('open')) return;
  saveProgress();
}

function findNextEpisode(series, seasonNumber, episodeNumber) {
  const season = series.seasons.find(se => se.season === seasonNumber);
  const epIndex = season.episodes.findIndex(e => e.episode === episodeNumber);
  if (epIndex < season.episodes.length - 1) {
    return { season: seasonNumber, episode: season.episodes[epIndex + 1].episode };
  }
  const seasonIdx = series.seasons.findIndex(se => se.season === seasonNumber);
  if (seasonIdx < series.seasons.length - 1) {
    const nextSeason = series.seasons[seasonIdx + 1];
    return { season: nextSeason.season, episode: nextSeason.episodes[0].episode };
  }
  return null;
}

closeBtn.onclick = () => {
  saveProgressOnExit();
  player.pause();
  playerModal.classList.remove('open');
  player.src = '';
};

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  if (!q) {
    renderCatalog(catalog);
    return;
  }
  const filtered = {
    series: catalog.series.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.seasons.some(se => se.episodes.some(ep => ep.title.toLowerCase().includes(q)))
    )
  };
  renderCatalog(filtered);
});

function loadCatalog() {
  fetch('/catalog.json')
    .then(res => res.json())
    .then(data => {
      catalog = data;
      renderPage();
    })
    .catch(err => {
      seriesContainer.innerHTML = "<div>Erreur de chargement du catalogue.</div>";
      console.error("Erreur chargement catalogue:", err);
    });
}

window.addEventListener('hashchange', renderPage);

loadCatalog();

window.startEpisode = startEpisode;
