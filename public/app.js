// app.js — Version complète avec "Commencer / Continuer" + player modal
document.addEventListener("DOMContentLoaded", () => {
  fetch("catalog.json") // ⚠ en statique, on enlève le / au début
    .then((res) => res.json())
    .then((data) => {
      window.catalogData = data;
      renderCatalog(data);
      setupModalClose();
    })
    .catch((err) => console.error("Erreur de chargement du catalogue :", err));
});

/* ---------------------------
   RENDER CATALOG (Séries & Films)
   --------------------------- */
function renderCatalog(data) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");

  // On réinjecte la structure par défaut du catalogue
  main.innerHTML = `
    <section>
      <h2 class="section-title">Séries</h2>
      <div id="seriesContainer"></div>
    </section>
    <section>
      <h2 class="section-title">Films</h2>
      <div id="moviesContainer"></div>
    </section>
  `;

  if (header) header.style.display = "flex";

  const seriesContainer = document.getElementById("seriesContainer");
  const moviesContainer = document.getElementById("moviesContainer");

  if (!seriesContainer || !moviesContainer) {
    console.error("Conteneurs introuvables : seriesContainer ou moviesContainer.");
    return;
  }

  // Séries
  if (Array.isArray(data.series)) {
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

      // Indicateur "En cours"
      const progress = JSON.parse(localStorage.getItem("progress_" + series.id) || "{}");
      if (progress.episode) {
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
  if (Array.isArray(data.movies)) {
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
   SHOW SERIES (fiche détaillée)
   --------------------------- */
function showSeries(series) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "none";

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

  // Retour catalogue
  document.getElementById("backBtn").addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });

  // Bouton commencer / continuer
  const progressKey = "progress_" + series.id;
  const existingProgress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  const btnContinue = document.getElementById("btnContinue");

  if (existingProgress.episode) {
    btnContinue.textContent = `Continuer (S${existingProgress.season}E${existingProgress.episode})`;
    btnContinue.onclick = () => {
      startEpisode(series.id, existingProgress.season, existingProgress.episode, existingProgress.time || 0);
    };
  } else {
    btnContinue.textContent = "Commencer la série";
    btnContinue.onclick = () => {
      const firstSeason = series.seasons?.[0];
      if (!firstSeason?.episodes?.length) return;
      const firstEp = firstSeason.episodes[0];
      const firstEpNum = Array.isArray(firstEp) ? firstEp[0] : firstEp.episode;
      startEpisode(series.id, firstSeason.season, firstEpNum, 0);
    };
  }

  // Liste des épisodes
  const episodesContainer = document.getElementById("episodesContainer");
  series.seasons?.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.className = "season-block";
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    const epsWrapper = document.createElement("div");
    epsWrapper.className = "season-episodes";

    season.episodes.forEach((ep) => {
      const num = Array.isArray(ep) ? ep[0] : ep.episode;
      const title = Array.isArray(ep) ? ep[1] : ep.title;
      const btn = document.createElement("button");
      btn.className = "episode-btn";
      btn.textContent = `${num}. ${title}`;
      btn.addEventListener("click", () => startEpisode(series.id, season.season, num, 0));
      epsWrapper.appendChild(btn);
    });

    seasonBlock.appendChild(epsWrapper);
    episodesContainer.appendChild(seasonBlock);
  });
}

/* ---------------------------
   SHOW MOVIE (fiche film)
   --------------------------- */
function showMovie(movie) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "none";

  main.innerHTML = `
    <div class="movie-detail">
      <button id="backBtn" class="back-btn">⬅ Retour au catalogue</button>
      <div class="movie-top">
        <img src="${movie.image}" alt="${movie.title}" class="movie-img">
        <div class="movie-meta">
          <h2>${movie.title}</h2>
          <p class="movie-description">${movie.description || "Pas de description."}</p>
          <button id="btnPlayMovie" class="play-btn">Regarder le film</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });

  document.getElementById("btnPlayMovie").onclick = () => {
    openPlayer(movie.src, movie.title);
  };
}

/* ---------------------------
   START EPISODE
   --------------------------- */
function startEpisode(seriesId, seasonNumber, episodeNumber, startTime = 0) {
  const series = window.catalogData.series.find((s) => s.id === seriesId);
  if (!series) return console.error("Série introuvable :", seriesId);

  const season = series.seasons.find((s) => Number(s.season) === Number(seasonNumber));
  if (!season) return console.error("Saison introuvable :", seasonNumber);

  const ep = season.episodes.find((e) =>
    Array.isArray(e) ? Number(e[0]) === Number(episodeNumber) : Number(e.episode) === Number(episodeNumber)
  );
  if (!ep) return console.error("Épisode introuvable :", episodeNumber);

  const epSrc = Array.isArray(ep) ? ep[2] : ep.src;
  const epTitle = Array.isArray(ep) ? ep[1] : ep.title;

  // Sauvegarde progression
  const progress = { season: seasonNumber, episode: episodeNumber, time: startTime };
  localStorage.setItem("progress_" + seriesId, JSON.stringify(progress));
  localStorage.setItem("lastSeries", JSON.stringify({ id: seriesId, season: seasonNumber, episode: episodeNumber }));

  // Ouvre le player
  openPlayer(epSrc, `${series.title} - S${seasonNumber}E${episodeNumber} - ${epTitle}`, seriesId, seasonNumber, episodeNumber, startTime);
}

/* ---------------------------
   OPEN PLAYER
   --------------------------- */
function openPlayer(src, displayTitle, seriesId = null, season = null, episode = null, startTime = 0) {
  const modal = document.getElementById("playerModal");
  const player = document.getElementById("player");
  const modalTitle = document.getElementById("modalTitle");
  const header = document.getElementById("mainHeader");

  if (header) header.style.display = "none";
  modalTitle.textContent = displayTitle || "";

  player.pause();
  player.removeAttribute("src");
  player.src = src;
  player.setAttribute("data-series", seriesId || "");
  player.setAttribute("data-season", season ?? "");
  player.setAttribute("data-episode", episode ?? "");

  modal.style.display = "flex";
  modal.classList.add("open");

  player.onloadedmetadata = () => {
    player.currentTime = startTime || 0;
    player.play();
  };

  player.ontimeupdate = () => saveProgress(seriesId, season, episode, player.currentTime);
  player.onpause = () => saveProgress(seriesId, season, episode, player.currentTime);

  player.onended = () => {
    saveProgress(seriesId, season, episode, 0);
    const next = findNextEpisode(seriesId, season, episode);
    next ? startEpisode(seriesId, next.season, next.episode, 0) : closePlayer();
  };

  document.getElementById("closeBtn").onclick = closePlayer;
}

/* ---------------------------
   FIND NEXT EPISODE
   --------------------------- */
function findNextEpisode(seriesId, seasonNumber, episodeNumber) {
  const series = window.catalogData.series.find((s) => s.id === seriesId);
  if (!series) return null;

  const seasonIdx = series.seasons.findIndex((s) => Number(s.season) === Number(seasonNumber));
  if (seasonIdx === -1) return null;

  const season = series.seasons[seasonIdx];
  const epIdx = season.episodes.findIndex((e) =>
    (Array.isArray(e) ? Number(e[0]) : Number(e.episode)) === Number(episodeNumber)
  );

  if (epIdx !== -1 && epIdx < season.episodes.length - 1) {
    const nextEp = season.episodes[epIdx + 1];
    return { season: seasonNumber, episode: Array.isArray(nextEp) ? nextEp[0] : nextEp.episode };
  }

  if (seasonIdx < series.seasons.length - 1) {
    const nextSeason = series.seasons[seasonIdx + 1];
    if (nextSeason.episodes?.length) {
      const firstEp = nextSeason.episodes[0];
      return { season: nextSeason.season, episode: Array.isArray(firstEp) ? firstEp[0] : firstEp.episode };
    }
  }
  return null;
}

/* ---------------------------
   SAVE PROGRESS
   --------------------------- */
function saveProgress(id, season, episode, time) {
  if (!id) return;
  const progress = { season: Number(season), episode: Number(episode), time: Number(time) || 0 };
  localStorage.setItem("progress_" + id, JSON.stringify(progress));
  localStorage.setItem("lastSeries", JSON.stringify({ id, season: Number(season), episode: Number(episode) }));
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
  } catch {}

  modal.style.display = "none";
  modal.classList.remove("open");
  if (header) header.style.display = "flex";
}

/* ---------------------------
   Setup fermeture modale
   --------------------------- */
function setupModalClose() {
  const modal = document.getElementById("playerModal");
  if (!modal) return;
  window.addEventListener("click", (e) => {
    if (e.target === modal) closePlayer();
  });
}
