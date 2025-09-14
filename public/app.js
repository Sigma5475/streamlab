document.addEventListener("DOMContentLoaded", () => {
  fetch("/catalogue.json")
    .then((response) => response.json())
    .then((data) => {
      window.catalogData = data; // pour la recherche
      renderCatalog(data);
      setupSearch();
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

      // Progression
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

      card.addEventListener("click", () => showMovie(movie));

      moviesContainer.appendChild(card);
    });
  }
}

// --- Affichage d’une série ---
function showSeries(series) {
  const playerModal = document.getElementById("playerModal");
  const modalTitle = document.getElementById("modalTitle");
  const player = document.getElementById("player");

  modalTitle.textContent = series.title;
  player.innerHTML = "";

  series.seasons.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    season.episodes.forEach((episode) => {
      const epBtn = document.createElement("button");
      epBtn.textContent = `${episode.episode}. ${episode.title}`;
      epBtn.addEventListener("click", () => {
        playVideo(episode.src);
        saveProgress(series.id, season.season, episode.episode, 0);
      });
      seasonBlock.appendChild(epBtn);
    });

    player.appendChild(seasonBlock);
  });

  playerModal.style.display = "block";
}

// --- Affichage d’un film ---
function showMovie(movie) {
  const playerModal = document.getElementById("playerModal");
  const modalTitle = document.getElementById("modalTitle");
  const player = document.getElementById("player");

  modalTitle.textContent = movie.title;
  player.innerHTML = `
    <button id="playMovieBtn">▶️ Lire le film</button>
  `;

  document.getElementById("playMovieBtn").addEventListener("click", () => {
    playVideo(movie.src);
  });

  playerModal.style.display = "block";
}

// --- Lecture vidéo ---
function playVideo(src) {
  const player = document.getElementById("player");
  player.innerHTML = `
    <video id="videoPlayer" controls autoplay style="width:100%; max-width:800px; display:block; margin:10px auto;">
      <source src="${src}" type="video/mp4">
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  `;
  const video = document.getElementById("videoPlayer");

  video.addEventListener("timeupdate", () => {
    const lastSeries = localStorage.getItem("lastSeries");
    if (lastSeries) {
      const { id, season, episode } = JSON.parse(lastSeries);
      saveProgress(id, season, episode, video.currentTime);
    }
  });
}

// --- Sauvegarde progression ---
function saveProgress(id, season, episode, time) {
  const progress = { season, episode, time };
  localStorage.setItem("progress_" + id, JSON.stringify(progress));
  localStorage.setItem("lastSeries", JSON.stringify({ id, season, episode }));
}

// --- Fermeture modale ---
document.getElementById("closeBtn").addEventListener("click", () => {
  document.getElementById("playerModal").style.display = "none";
});

// --- Recherche ---
function setupSearch() {
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredData = { series: [], movies: [] };

    window.catalogData.series.forEach(s => {
      if (s.title.toLowerCase().includes(query)) filteredData.series.push(s);
    });
    window.catalogData.movies.forEach(m => {
      if (m.title.toLowerCase().includes(query)) filteredData.movies.push(m);
    });

    renderCatalog(filteredData);
  });
}
