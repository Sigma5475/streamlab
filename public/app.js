// Sélecteurs DOM
const mainContainer = document.querySelector('main.container');
const seriesContainer = document.getElementById('seriesContainer');
const searchInput = document.getElementById('search');
const modalTitle = document.getElementById('modalTitle');
const playerModal = document.getElementById('playerModal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');

// Variable globale pour stocker le catalogue
let catalog = { series: [] };

// Utilitaire pour changer la page (SPA style)
function navigateTo(hash) {
  window.location.hash = hash;
  renderPage();
}

// Fonction principale pour router
function renderPage() {
  const hash = window.location.hash;
  if (hash.startsWith('#serie=')) {
    const serieId = hash.replace('#serie=', '');
    renderSeriesPage(serieId);
  } else {
    renderCatalog(catalog);
  }
}

// Affichage du catalogue de séries
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

    // Image de la série
    if (series.image) {
      const img = document.createElement('img');
      img.src = series.image;
      img.alt = series.title;
      img.style = "width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px";
      card.appendChild(img);
    }

    // Titre
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = series.title;
    card.appendChild(title);

    // Description courte si dispo
    if (series.description) {
      const desc = document.createElement('div');
      desc.className = 'meta';
      desc.textContent = series.description.slice(0, 80) + (series.description.length > 80 ? '...' : '');
      card.appendChild(desc);
    }

    // Progression (si déjà commencée)
    const progress = JSON.parse(localStorage.getItem('progress_' + series.id) || '{}');
    if (progress.episode) {
      const progDiv = document.createElement('div');
      progDiv.className = 'meta';
      progDiv.textContent = `En cours : Saison ${progress.season}, épisode ${progress.episode}`;
      card.appendChild(progDiv);
    }

    // Clic : aller sur la page série
    card.onclick = () => navigateTo('#serie=' + series.id);

    seriesContainer.appendChild(card);
  });
}

// Affichage page d'une série
function renderSeriesPage(seriesId) {
  const series = catalog.series.find(s => s.id === seriesId);
  if (!series) {
    seriesContainer.innerHTML = "<div>Série introuvable.</div>";
    return;
  }

  // Progression
  const progress = JSON.parse(localStorage.getItem('progress_' + seriesId) || '{}');

  let html = `
    <div class="serie-info">
      ${series.image ? `<img src="${series.image}" alt="${series.title}" style="width:300px;border-radius:12px;margin-bottom:16px;">` : ''}
      <h2>${series.title}</h2>
      <p>${series.description || ''}</p>
      <button id="btnContinue" class="btn" style="margin-bottom:14px">
        ${progress.episode ? 'Continuer la lecture' : 'Commencer la série'}
      </button>
      <h3>Choisir un épisode :</h3>
      <ul style="list-style:none;padding:0">
  `;
  series.seasons.forEach(season => {
    html += `<li style="margin-bottom:6px;font-weight:bold;color:var(--muted)">Saison ${season.season}</li>`;
    season.episodes.forEach(ep => {
      html += `<li style="margin-left:12px">
        Episode ${ep.episode} - ${ep.title}
        <button class="btn" onclick="startEpisode('${series.id}',${season.season},${ep.episode})">Lecture</button>
      </li>`;
    });
  });
  html += `</ul></div>`;
  seriesContainer.innerHTML = html;

  // Bouton continuer/commencer
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

// Fonction pour démarrer un épisode
function startEpisode(seriesId, seasonNumber, episodeNumber, startTime = 0) {
  const series = catalog.series.find(s => s.id === seriesId);
  const season = series.seasons.find(se => se.season === seasonNumber);
  const episode = season.episodes.find(e => e.episode === episodeNumber);

  openPlayer(series, season, episode, startTime);

  // Sauvegarde progression
  localStorage.setItem('progress_' + seriesId, JSON.stringify({
    season: seasonNumber,
    episode: episodeNumber,
    time: startTime
  }));

  // Enregistre l'ID de la série en cours pour l'autoplay
  player.setAttribute('data-series', seriesId);
  player.setAttribute('data-season', seasonNumber);
  player.setAttribute('data-episode', episodeNumber);
}

// Lecture vidéo + gestion du prochain épisode
function openPlayer(series, season, episode, startTime = 0) {
  modalTitle.textContent = `${series.title} S${season.season}E${episode.episode} - ${episode.title}`;
  player.src = episode.src;
  playerModal.classList.add('open');
  player.currentTime = startTime || 0;
  player.play();

  // Gestion progression
  player.ontimeupdate = () => {
    localStorage.setItem('progress_' + series.id, JSON.stringify({
      season: season.season,
      episode: episode.episode,
      time: player.currentTime
    }));
  };

  // Lecture automatique du prochain épisode
  player.onended = () => {
    const next = findNextEpisode(series, season.season, episode.episode);
    if (next) {
      setTimeout(() => startEpisode(series.id, next.season, next.episode), 800);
    } else {
      // Fin de la série !
      playerModal.classList.remove('open');
      alert("Bravo, vous avez terminé la série !");
    }
  };
}

// Trouve l'épisode suivant
function findNextEpisode(series, seasonNumber, episodeNumber) {
  const season = series.seasons.find(se => se.season === seasonNumber);
  const epIndex = season.episodes.findIndex(e => e.episode === episodeNumber);
  // Prochain épisode dans la même saison
  if (epIndex < season.episodes.length - 1) {
    return {
      season: seasonNumber,
      episode: season.episodes[epIndex + 1].episode
    };
  }
  // Première épisode de la saison suivante
  const seasonIdx = series.seasons.findIndex(se => se.season === seasonNumber);
  if (seasonIdx < series.seasons.length - 1) {
    const nextSeason = series.seasons[seasonIdx + 1];
    return {
      season: nextSeason.season,
      episode: nextSeason.episodes[0].episode
    };
  }
  return null;
}

// Fermer le lecteur
closeBtn.onclick = () => {
  player.pause();
  playerModal.classList.remove('open');
  player.src = '';
};

// Recherche dans le catalogue
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

// Charge le catalogue
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

// Gère le routage SPA
window.addEventListener('hashchange', renderPage);

// Initialisation
loadCatalog();

// Fonction globale pour lecture bouton épisode (nécessaire pour inline onclick)
window.startEpisode = startEpisode;
