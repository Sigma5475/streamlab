// app.js — corrected: renderCatalog recrée le DOM si besoin + search + showMovie
document.addEventListener("DOMContentLoaded", () => {
  fetch("/catalog.json")
    .then((res) => res.json())
    .then((data) => {
      window.catalogData = data;
      renderCatalog(data);
      setupModalClose();
      setupSearch();
    })
    .catch((err) => console.error("Erreur de chargement du catalogue :", err));
});

/* ---------------------------
   RENDER CATALOG (Séries & Films)
   --------------------------- */
function renderCatalog(data = window.catalogData) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");

  // Réaffiche le header
  if (header) header.style.display = "flex";

  // Si les containers n'existent plus (par ex. après showSeries), on les recrée dans <main>
  let seriesContainer = document.getElementById("seriesContainer");
  let moviesContainer = document.getElementById("moviesContainer");
  if (!seriesContainer || !moviesContainer) {
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
    seriesContainer = document.getElementById("seriesContainer");
    moviesContainer = document.getElementById("moviesContainer");
  }

  if (!seriesContainer || !moviesContainer) {
    console.error("Conteneurs introuvables : seriesContainer ou moviesContainer.");
    return;
  }

  // Utilise la data fournie (peut être filtrée par la recherche)
  const source = data || window.catalogData || { series: [], movies: [] };

  seriesContainer.innerHTML = "";
  moviesContainer.innerHTML = "";

  // Séries
  if (Array.isArray(source.series)) {
    source.series.forEach((series) => {
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
  if (Array.isArray(source.movies)) {
    source.movies.forEach((movie) => {
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

  // Retour catalogue (recréera si besoin les containers)
  document.getElementById("backBtn").addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });

  // Bouton commencer / continuer
  const progressKey = "progress_" + series.id;
  const existingProgress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  const btnContinue = document.getElementById("btnContinue");

  if (existingProgress && existingProgress.episode) {
    btnContinue.textContent = `Continuer (S${existingProgress.season}E${existingProgress.episode})`;
    btnContinue.onclick = () => {
      startEpisode(series.id, Number(existingProgress.season), Number(existingProgress.episode), Number(existingProgress.time) || 0);
    };
  } else {
    btnContinue.textContent = "Commencer la série";
    btnContinue.onclick = () => {
      const firstSeason = series.seasons?.[0];
      if (!firstSeason?.episodes?.length) return;
      const firstEp = firstSeason.episodes[0];
      const firstEpNum = Array.isArray(firstEp) ? firstEp[0] : firstEp.episode;
      startEpisode(series.id, Number(firstSeason.season), Number(firstEpNum), 0);
    };
  }

  // Liste des épisodes (compact arrays [num, title, src] ou objets)
  const episodesContainer = document.getElementById("episodesContainer");
  series.seasons?.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.className = "season-block";
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    const epsWrapper = document.createElement("div");
    epsWrapper.className = "season-episodes";

    season.episodes.forEach((ep) => {
      const num = Array.isArray(ep) ? ep[0] : (ep.episode || 0);
      const title = Array.isArray(ep) ? ep[1] : (ep.title || "Épisode");
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
   SHOW MOVIE (fiche film simple)
   --------------------------- */
function showMovie(movie) {
  const main = document.querySelector("main");
  const header = document.getElementById("mainHeader");
  if (header) header.style.display = "none";

  main.innerHTML = `
    <div class="movie-detail">
      <button id="backBtnMovie" class="back-btn">⬅ Retour au catalogue</button>
      <div class="movie-top">
        <img src="${movie.image}" alt="${movie.title}" class="series-img">
        <div class="series-meta">
          <h2>${movie.title}</h2>
          <p class="series-description">${movie.description || "Pas de description."}</p>
          <button id="btnPlayMovie" class="play-btn">▶️ Lire le film</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("backBtnMovie").addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });

  document.getElementById("btnPlayMovie").addEventListener("click", () => {
    // on utilise openPlayer (movie n'est pas une série => ne sauvegarde pas la progression)
    openPlayer(movie.src, movie.title, null, null, null, 0);
  });
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

  // Sauvegarde progression initiale
  const progress = { season: Number(seasonNumber), episode: Number(episodeNumber), time: Number(startTime) || 0 };
  localStorage.setItem("progress_" + seriesId, JSON.stringify(progress));
  localStorage.setItem("lastSeries", JSON.stringify({ id: seriesId, season: Number(seasonNumber), episode: Number(episodeNumber) }));

  // Ouvre le player
  openPlayer(epSrc, `${series.title} - S${seasonNumber}E${episodeNumber} - ${epTitle}`, seriesId, seasonNumber, episodeNumber, startTime);
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

  player.pause();
  player.removeAttribute("src");
  player.src = src;
  player.setAttribute("data-series", seriesId || "");
  player.setAttribute("data-season", season ?? "");
  player.setAttribute("data-episode", episode ?? "");

  modal.style.display = "flex";
  modal.classList.add("open");

  player.onloadedmetadata = () => {
    try { player.currentTime = Number(startTime) || 0; } catch (e) {}
    player.play();
  };

  player.ontimeupdate = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    if (sId) saveProgress(sId, sNum, eNum, player.currentTime);
  };
  player.onpause = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    if (sId) saveProgress(sId, sNum, eNum, player.currentTime);
  };

  player.onended = () => {
    const sId = player.getAttribute("data-series");
    const sNum = Number(player.getAttribute("data-season"));
    const eNum = Number(player.getAttribute("data-episode"));
    if (sId) saveProgress(sId, sNum, eNum, 0);
    const next = findNextEpisode(sId, sNum, eNum);
    next ? startEpisode(sId, next.season, next.episode, 0) : closePlayer();
  };

  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) closeBtn.onclick = closePlayer;
}

/* ---------------------------
   FIND NEXT EPISODE
   --------------------------- */
function findNextEpisode(seriesId, seasonNumber, episodeNumber) {
  const series = window.catalogData.series.find((s) => s.id === seriesId);
  if (!series) return null;

  const seasonIdx = series.seasons.findIndex((s) => Number(s.season) === Number(seasonNumber));
  if (seasonIdx === -1) return null;

  const season = series.seasons
