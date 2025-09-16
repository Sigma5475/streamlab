document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  let catalogueData = null;

  // Charger le catalogue JSON
  fetch("catalog.json")
    .then(res => res.json())
    .then(data => {
      catalogueData = data;
      renderCatalog(data);
    })
    .catch(err => console.error("Erreur de chargement du catalogue :", err));

  // --- Affichage du catalogue ---
  function renderCatalog(data) {
    app.innerHTML = `
      <header class="main-header">
        <h1>StreamLab</h1>
      </header>
      <section class="catalogue">
        <h2>Séries</h2>
        <div class="grid" id="seriesGrid">
          ${data.series.map(serie => `
            <div class="card" data-id="${serie.id}" data-type="series">
              <img src="${serie.image}" alt="${serie.title}">
              <h3>${serie.title}</h3>
            </div>
          `).join("")}
        </div>
        <h2>Films</h2>
        <div class="grid" id="moviesGrid">
          ${data.movies.map(movie => `
            <div class="card" data-id="${movie.id}" data-type="movie">
              <img src="${movie.image}" alt="${movie.title}">
              <h3>${movie.title}</h3>
            </div>
          `).join("")}
        </div>
      </section>
    `;

    // Écouteurs sur les cartes
    document.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const type = card.dataset.type;
        if (type === "series") {
          const serie = data.series.find(s => s.id === id);
          renderSeriesInfo(serie);
        } else {
          const movie = data.movies.find(m => m.id === id);
          renderMovieInfo(movie);
        }
      });
    });
  }

  // --- Page info série ---
  function renderSeriesInfo(series) {
    app.innerHTML = `
      <div class="series-info">
        <div class="series-header">
          <img src="${series.image}" alt="${series.title}" class="poster">
          <div class="series-details">
            <h2>${series.title}</h2>
            <p>${series.description}</p>
            <div class="actions">
              <button id="start-series">▶️ Commencer la série</button>
              <button id="back">⬅️ Retour au catalogue</button>
            </div>
          </div>
        </div>
        <div class="seasons">
          ${series.seasons.map(season => `
            <div class="season">
              <h3>Saison ${season.season}</h3>
              <div class="episodes-grid">
                ${season.episodes.map(ep => `
                  <button class="episode-btn" data-src="${ep[2]}">
                    Épisode ${ep[0]} - ${ep[1]}
                  </button>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
        <div id="player-container"></div>
      </div>
    `;

    // Bouton retour
    document.getElementById("back").addEventListener("click", () => renderCatalog(catalogueData));

    // Bouton commencer
    document.getElementById("start-series").addEventListener("click", () => {
      const firstEp = series.seasons[0].episodes[0][2];
      playVideo(firstEp);
    });

    // Boutons épisodes
    document.querySelectorAll(".episode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        playVideo(btn.dataset.src);
      });
    });
  }

  // --- Page info film ---
  function renderMovieInfo(movie) {
    app.innerHTML = `
      <div class="movie-info">
        <div class="movie-header">
          <img src="${movie.image}" alt="${movie.title}" class="poster">
          <div class="movie-details">
            <h2>${movie.title}</h2>
            <p>${movie.description}</p>
            <div class="actions">
              <button id="play">▶️ Regarder</button>
              <button id="back">⬅️ Retour au catalogue</button>
            </div>
          </div>
        </div>
        <div id="player-container"></div>
      </div>
    `;

    document.getElementById("back").addEventListener("click", () => renderCatalog(catalogueData));
    document.getElementById("play").addEventListener("click", () => playVideo(movie.src));
  }

  // --- Player vidéo stylé ---
  function playVideo(src) {
    const player = document.getElementById("player-container");
    player.innerHTML = `
      <video controls autoplay class="video-player">
        <source src="${src}" type="video/mp4">
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    `;
  }
});
