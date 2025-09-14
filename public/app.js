document.addEventListener("DOMContentLoaded", () => {
  fetch("catalog.json")
    .then((response) => response.json())
    .then((data) => {
      window.catalogData = data; // on garde les données globalement
      renderCatalog(data);
    })
    .catch((error) =>
      console.error("Erreur de chargement du catalogue :", error)
    );
});

// --- Affichage du catalogue ---
function renderCatalog(data) {
  const main = document.querySelector("main");
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

  const seriesContainer = document.getElementById("seriesContainer");
  const moviesContainer = document.getElementById("moviesContainer");

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

// --- Affichage d’une série ---
function showSeries(series) {
  const main = document.querySelector("main");
  main.innerHTML = `
    <div class="series-detail">
      <button class="back-btn">← Retour au catalogue</button>
      <h2>${series.title}</h2>
      <img src="${series.image}" alt="${series.title}" class="series-image">
      <p class="series-description">${series.description || "Pas de description disponible."}</p>
      <div id="seasonsContainer"></div>
    </div>
  `;

  const seasonsContainer = document.getElementById("seasonsContainer");

  series.seasons.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.className = "season-block";
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    season.episodes.forEach((episode) => {
      const epDiv = document.createElement("div");
      epDiv.className = "episode-card";
      const epBtn = document.createElement("button");
      epBtn.className = "episode-btn";
      epBtn.textContent = `${episode.episode}. ${episode.title}`;
      epBtn.addEventListener("click", () => {
        playVideo(episode.src);
        saveProgress(series.id, season.season, episode.episode, 0);
      });
      epDiv.appendChild(epBtn);
      seasonBlock.appendChild(epDiv);
    });

    seasonsContainer.appendChild(seasonBlock);
  });

  // Bouton retour
  const backBtn = main.querySelector(".back-btn");
  backBtn.addEventListener("click", () => {
    renderCatalog(window.catalogData);
  });
}

// --- Affichage d’un film ---
function showMovie(movie) {
  const main = document.querySelector("main");
  main.innerHTML = `
    <div class="movie-detail">
      <button class="back-btn">← Retour au catalogue</button>
      <h2>${movie.title}</h2>
      <img src="${movie.image}" alt="${movie.title}" class="movie-image">
      <p class="movie-description">${movie.description || "Pas de description disponible."}</p>
      <button id="playMovie" class="episode-btn">▶️ Lire le film</button>
    </div>
  `;

  document.getElementById("playMovie").addEventListener("click", () => {
    playVideo(movie.src);
  });

  // Bouton retour
  const backBtn = main.querySelector(".back-btn");
  backBtn.addEventListener("click", () => {
    renderCatalog(window.catalogData);
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
