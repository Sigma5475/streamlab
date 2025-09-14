document.addEventListener("DOMContentLoaded", () => {
  fetch("/catalog.json")
    .then((response) => response.json())
    .then((data) => {
      renderCatalog(data);
    })
    .catch((error) =>
      console.error("Erreur de chargement du catalogue :", error)
    );
});

// --- Affichage du catalogue ---
function renderCatalog(data) {
  const seriesContainer = document.getElementById("seriesContainer");
  const moviesContainer = document.getElementById("moviesContainer");

  seriesContainer.innerHTML = "";
  moviesContainer.innerHTML = "";

  // --- Séries ---
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

      // Progression = épisode en cours
      const progress = JSON.parse(
        localStorage.getItem("progress_" + series.id) || "{}"
      );
      if (progress.episode) {
        const progDiv = document.createElement("div");
        progDiv.className = "now-playing";
        progDiv.textContent = `En cours : S${progress.season}E${progress.episode} ${
          progress.time ? "(" + Math.floor(progress.time / 60) + " min)" : ""
        }`;
        card.appendChild(progDiv);
      }

      card.addEventListener("click", () => {
        showSeries(series);
      });

      seriesContainer.appendChild(card);
    });
  }

  // --- Films ---
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

      card.addEventListener("click", () => {
        showMovie(movie);
      });

      moviesContainer.appendChild(card);
    });
  }
}

// --- Affichage d’une série complète ---
function showSeries(series) {
  const main = document.querySelector("main");
  main.innerHTML = `
    <div class="series-detail">
      <button id="backBtn" class="back-btn">⬅ Retour au catalogue</button>
      <h2>${series.title}</h2>
      <img src="${series.image}" alt="${series.title}" class="series-image">
      <p class="series-description">${series.description || ""}</p>
      <div id="episodesContainer"></div>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    fetch("/catalog.json")
      .then((response) => response.json())
      .then((data) => renderCatalog(data));
  });

  const episodesContainer = document.getElementById("episodesContainer");

  series.seasons.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.className = "season-block";
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    season.episodes.forEach((episode) => {
      const ep = document.createElement("div");
      ep.className = "episode-card";
      ep.innerHTML = `
        <button class="episode-btn">${episode.episode}. ${episode.title}</button>
      `;
      ep.querySelector("button").addEventListener("click", () => {
        playVideo(episode.src);
        saveProgress(series.id, season.season, episode.episode, 0);
      });
      seasonBlock.appendChild(ep);
    });

    episodesContainer.appendChild(seasonBlock);
  });
}

// --- Affichage d’un film ---
function showMovie(movie) {
  const main = document.querySelector("main");
  main.innerHTML = `
    <div class="movie-detail">
      <button id="backBtn" class="back-btn">⬅ Retour au catalogue</button>
      <h2>${movie.title}</h2>
      <img src="${movie.image}" alt="${movie.title}" class="movie-image">
      <p class="movie-description">${movie.description || ""}</p>
      <button id="playMovie" class="play-btn">▶️ Lire le film</button>
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    fetch("/catalog.json")
      .then((response) => response.json())
      .then((data) => renderCatalog(data));
  });

  document.getElementById("playMovie").addEventListener("click", () => {
    playVideo(movie.src);
  });
}

// --- Lecture vidéo ---
function playVideo(src) {
  const main = document.querySelector("main");
  main.innerHTML = `
    <video controls autoplay width="100%">
      <source src="${src}" type="video/mp4">
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  `;

  const video = main.querySelector("video");
  video.addEventListener("timeupdate", () => {
    const currentTime = video.currentTime;
    const lastSeries = localStorage.getItem("lastSeries");
    if (lastSeries) {
      const { id, season, episode } = JSON.parse(lastSeries);
      saveProgress(id, season, episode, currentTime);
    }
  });
}

// --- Sauvegarde progression ---
function saveProgress(id, season, episode, time) {
  const progress = { season, episode, time };
  localStorage.setItem("progress_" + id, JSON.stringify(progress));
  localStorage.setItem("lastSeries", JSON.stringify({ id, season, episode }));
}
