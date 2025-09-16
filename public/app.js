// app.js — version complète avec "Commencer / Continuer" + player modal
document.addEventListener("DOMContentLoaded", () => {
  fetch("/catalog.json")
    .then((res) => res.json())
    .then((data) => {
      window.catalogData = data;
      renderCatalog(data);
      setupModalClose();
    })
    .catch((err) => console.error("Erreur de chargement du catalogue :", err));
});

/* ---------------------------
   RENDER CATALOG (Séries/Films)
   --------------------------- */
function renderCatalog(data) {
  const seriesContainer = document.getElementById("seriesContainer");
  const moviesContainer = document.getElementById("moviesContainer");
  const header = document.getElementById("mainHeader");

  // réaffiche le header quand on revient au catalogue
  if (header) header.style.display = "flex";

  if (!seriesContainer || !moviesContainer) {
    console.error("seriesContainer ou moviesContainer introuvable dans le DOM.");
    return;
  }

  seriesContainer.innerHTML = "";
  moviesContainer.innerHTML = "";

  // Séries
  if (data.series && Array.isArray(data.series)) {
    data.series.forEach((series) => {
      const card = document.createElement("div");
      card.className = "card serie-card";

      const img = document.createElement("img");
      img.src = series.image;
      img.alt = series.title;

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = series.title;

      card.appendChild(img);
      card.appendChild(title);

      // Indicateur "En cours" si présent
      const progress = JSON.parse(localStorage.getItem("progress_" + series.id) || "{}");
      if (progress && progress.episode) {
        const progDiv = document.createElement("div");
        progDiv.className = "now-playing";
        progDiv.textContent = `En cours : S${progress.season}E${progress.episode}`;
        card.appendChild(progDiv);
      }

      card.addEventListener("click", () => showSeries(series));

      seriesContainer.appendChild(card);
    });
  }

  // Films
  if (data.movies && Array.isArray(data.movies)) {
    data.movies.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "card movie-card";

      const img = document.createElement("img");
      img.src = movie.image;
      img.alt = movie.title;

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = movie.title;

      card.appendChild(img);
      card.appendChild(title);

      card.addEventListener("click", () => showMovie(movie));

      moviesContainer.appendChild(card);
    });
  }
}

/* ---------------------------
   SHOW SERIES (fiche info)
   --------------------------- */
function showSeries(series) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "none"; // masque le header en affichant la fiche

  // fiche série (image réduite + description + bouton commencer/continuer)
  main.innerHTML = `
    <div class="series-detail">
      <button id="backBtn" class="back-btn">⬅ Retour au catalogue</button>
      <div class="series-top">
        <img src="${series.image}" alt="${series.title}" class="series-img">
        <div class="series-meta">
          <h2>${series.title}</h2>
          <p class="series-description">${series.description || "Pas de description."}</p>
          <button id="btnContinue" class="play-btn"></button>
        </div>
      </div>
      <div id="episodesContainer" class="episodes-list"></div>
    </div>
  `;

  // bouton retour
  document.getElementById("backBtn").addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });

  // bouton commencer / continuer
  const progressKey = "progress_" + series.id;
  const existingProgress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  const btnContinue = document.getElementById("btnContinue");

  if (existingProgress && existingProgress.episode) {
    btnContinue.textContent = `Continuer la série (S${existingProgress.season}E${existingProgress.episode})`;
    btnContinue.onclick = () => {
      startEpisode(series.id, Number(existingProgress.season), Number(existingProgress.episode), Number(existingProgress.time) || 0);
    };
  } else {
    btnContinue.textContent = "Commencer la série";
    btnContinue.onclick = () => {
      // premier épisode : première saison disponible
      const firstSeason = (series.seasons && series.seasons[0]) || null;
      if (!firstSeason || !firstSeason.episodes || firstSeason.episodes.length === 0) return;
      const firstEp = firstSeason.episodes[0];
      const firstEpNum = Array.isArray(firstEp) ? Number(firstEp[0]) : Number(firstEp.episode);
      startEpisode(series.id, Number(firstSeason.season), firstEpNum, 0);
    };
  }

  // affichage compact des saisons / épisodes (JSON compact [num, title, src])
  const episodesContainer = document.getElementById("episodesContainer");
  if (series.seasons && Array.isArray(series.seasons)) {
    series.seasons.forEach((season) => {
      const seasonBlock = document.createElement("div");
      seasonBlock.className = "season-block";
      seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

      const epsWrapper = document.createElement("div");
      epsWrapper.className = "season-episodes";

      season.episodes.forEach((epArr) => {
        // epArr attendu : [num, title, src]
        const num = Array.isArray(epArr) ? epArr[0] : (epArr.episode || 0);
        const title = Array.isArray(epArr) ? epArr[1] : (epArr.title || "Épisode");
        const src = Array.isArray(epArr) ? epArr[2] : (epArr.src || "");

        const epDiv = document.createElement("div");
        epDiv.className = "episode";

        const btn = document.createElement("button");
        btn.className = "episode-btn";
        btn.textContent = `${num}. ${title}`;
        btn.addEventListener("click", () => {
          // quand on clique sur un épisode on démarre depuis le début
          startEpisode(series.id, Number(season.season), Number(num), 0);
        });

        epDiv.appendChild(btn);
        epsWrapper.appendChild(epDiv);
      });

      seasonBlock.appendChild(epsWrapper);
      episodesContainer.appendChild(seasonBlock);
    });
  }
}

/* ---------------------------
   START EPISODE (lance et sauvegarde)
   --------------------------- */
function startEpisode(seriesId, seasonNumber, episodeNumber, startTime = 0) {
  const series = (window.catalogData && window.catalogData.series) ? window.catalogData.series.find(s => s.id === seriesId) : null;
  if (!series) {
    console.error("Série non trouvée pour id", seriesId);
    return;
  }

  const season = series.seasons.find(se => Number(se.season) === Number(seasonNumber));
  if (!season) {
    console.error("Saison non trouvée", seasonNumber);
    return;
  }

  // trouver l'épisode (format compact [num, title, src] possible)
  const epItem = season.episodes.find(e => {
    if (Array.isArray(e)) return Number(e[0]) === Number(episodeNumber);
    return Number(e.episode) === Number(episodeNumber);
  });
  if (!epItem) {
    console.error("Épisode non trouvé", episodeNumber);
    return;
  }

  const epSrc = Array.isArray(epItem) ? epItem[2] : epItem.src;
  const epTitle = Array.isArray(epItem) ? epItem[1] : epItem.title;

  // sauvegarde initiale (pour permettre de "Continuer")
  const progressObj = { season: Number(seasonNumber), episode: Number(episodeNumber), time: Number(startTime) || 0 };
  localStorage.setItem("progress_" + seriesId, JSON.stringify(progressObj));
  localStorage.setItem("lastSeries", JSON.stringify({ id: seriesId, season: Number(seasonNumber), episode: Number(episodeNumber) }));

  // ouvre le player modal et y lance la vidéo
  openPlayer(epSrc, `${series.title} - S${seasonNumber}E${episodeNumber} - ${epTitle}`, seriesId, Number(seasonNumber), Number(episodeNumber), Number(startTime) || 0);
}

/* ---------------------------
   OPEN PLAYER (modal + gestion events)
   --------------------------- */
function openPlayer(src, displayTitle, seriesId = null, season = null, episode = null, startTime = 0) {
  const modal = document.getElementById("playerModal");
  const player = document.getElementById("player");
  const modalTitle = document.getElementById("modalTitle");
  const header = document.getElementById("mainHeader");

  if (header) header.style.display = "none";
  modalTitle.textContent = displayTitle || "";

  // prépare le player (balise <video id="player"> existe dans index.html)
  // on met simplement la source et on règle currentTime après loadedmetadata
  player.pause();
  player.removeAttribute("src"); // clear
  player.src = src;
  player.setAttribute("data-series", seriesId ? seriesId : "");
  player.setAttribute("data-season", season !== null ? String(season) : "");
  player.setAttribute("data-episode", episode !== null ? String(episode) : "");

  // affiche la modale (CSS : .modal { display:none } -> on force display)
  modal.style.display = "flex";
  modal.classList.add("open");

  // quand metadata prêt on positionne le temps et on play
  player.onloadedmetadata = () => {
    try {
      player.currentTime = Number(startTime) || 0;
    } catch (e) { /* ignore si time invalide */ }
    player.play();
  };

  // sauvegarde automatique en cours de lecture / pause
  player.ontimeupdate = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    if (sId) {
      saveProgress(sId, sNum, eNum, player.currentTime);
    }
  };
  player.onpause = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    if (sId) {
      saveProgress(sId, sNum, eNum, player.currentTime);
    }
  };

  // fin de l'épisode -> propose épisode suivant si présent
  player.onended = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    saveProgress(sId, sNum, eNum, 0); // reset time à 0 ou on peut supprimer si fini
    const next = findNextEpisode(sId, sNum, eNum);
    if (next) {
      // lance le suivant automatiquement
      startEpisode(sId, next.season, next.episode, 0);
    } else {
      // plus d'épisodes -> fermer modal et revenir à la page série
      closePlayer();
      // si on veut, on peut effacer la progress finale : localStorage.removeItem("progress_" + sId);
    }
  };

  // close button handler (défini dans setupModalClose aussi)
  const closeBtn = document.getElementById("closeBtn");
  closeBtn.onclick = () => {
    closePlayer();
  };
}

/* ---------------------------
   FIND NEXT EPISODE
   --------------------------- */
function findNextEpisode(seriesId, seasonNumber, episodeNumber) {
  const data = window.catalogData;
  if (!data || !data.series) return null;
  const series = data.series.find(s => s.id === seriesId);
  if (!series) return null;

  // cherche saison
  const seasonIdx = series.seasons.findIndex(se => Number(se.season) === Number(seasonNumber));
  if (seasonIdx === -1) return null;
  const season = series.seasons[seasonIdx];

  // trouver index d'épisode dans cette saison
  const epIdx = season.episodes.findIndex(e => {
    const num = Array.isArray(e) ? Number(e[0]) : Number(e.episode);
    return num === Number(episodeNumber);
  });

  if (epIdx !== -1 && epIdx < season.episodes.length - 1) {
    // même saison, épisode suivant
    const nextEP = season.episodes[epIdx + 1];
    const nextNum = Array.isArray(nextEP) ? Number(nextEP[0]) : Number(nextEP.episode);
    return { season: Number(seasonNumber), episode: nextNum };
  }

  // sinon passe à la saison suivante
  if (seasonIdx < series.seasons.length - 1) {
    const nextSeason = series.seasons[seasonIdx + 1];
    if (nextSeason.episodes && nextSeason.episodes.length > 0) {
      const firstEP = nextSeason.episodes[0];
      const firstNum = Array.isArray(firstEP) ? Number(firstEP[0]) : Number(firstEP.episode);
      return { season: Number(nextSeason.season), episode: firstNum };
    }
  }

  return null;
}

/* ---------------------------
   SAVE PROGRESS (utilisé pendant lecture)
   --------------------------- */
function saveProgress(id, season, episode, time) {
  if (!id) return;
  const progress = { season: Number(season), episode: Number(episode), time: Number(time) || 0 };
  localStorage.setItem("progress_" + id, JSON.stringify(progress));
  // on garde lastSeries pour compatibilité
  localStorage.setItem("lastSeries", JSON.stringify({ id: id, season: Number(season), episode: Number(episode) }));
}

/* ---------------------------
   CLOSE PLAYER
   --------------------------- */
function closePlayer() {
  const modal = document.getElementById("playerModal");
  const player = document.getElementById("player");
  const header = document.getElementById("mainHeader");

  try {
    player.pause();
    player.removeAttribute("src");
  } catch (e) { /* ignore */ }

  modal.style.display = "none";
  modal.classList.remove("open");

  if (header) header.style.display = "flex";
}

/* ---------------------------
   Setup fermeture modale (clic à l'extérieur)
   --------------------------- */
function setupModalClose() {
  const modal = document.getElementById("playerModal");
  if (!modal) return;
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closePlayer();
    }
  });
}
