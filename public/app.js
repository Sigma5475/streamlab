document.addEventListener("DOMContentLoaded", () => {
  fetch("catalog.json")
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

  const header = document.getElementById("mainHeader");
  header.style.display = "flex"; // Réaffiche le header

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
  const header = document.getElementById("mainHeader");
  header.style.display = "none"; // Masque le header

  main.innerHTML = `
    <button id="backBtn" class="back-btn">⬅ Retour au catalogue</button>
    <div class="series-info">
      <img src="${series.image}" alt="${series.title}" class="series-img">
      <div class="series-desc">
        <h2>${series.title}</h2>
        <p>${series.description}</p>
      </div>
    </div>
    <div id="episodesContainer"></div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    renderCatalog(JSON.parse(localStorage.getItem("catalogData")));
  });

  // Stocke le catalogue pour revenir facilement
  localStorage.setItem("catalogData", JSON.stringify({
    series: JSON.parse(localStorage.getItem("catalogData"))?.series || [],
    movies: JSON.parse(localStorage.getItem("catalogData"))?.movies || []
  }));

  const episodesContainer = document.getElementById("episodesContainer");

  series.seasons.forEach((season) => {
    const seasonBlock = document.createElement("div");
    seasonBlock.className = "season-block";
    seasonBlock.innerHTML = `<h3>Saison ${season.season}</h3>`;

    season.episodes.forEach((epArr) => {
      const [num, title, src] = epArr;
      const epDiv = document.createElement("div");
      epDiv.className = "episode";

      const btn = document.createElement("button");
      btn.textContent = `${num}. ${title}`;
      btn.addEventListener("click", () => {
        openPlayer(src, series.title + " - S" + season.season + "E" + num);
      });

      epDiv.appendChild(btn);
      seasonBlock.appendChild(epDiv);
    });

    episodesContainer.appendChild(seasonBlock);
  });
}

// --- Affichage d’un film ---
function showMovie(movie) {
  const header = document.getElementById("mainHeader");
  header.style.display = "none"; // Masque le header

  openPlayer(movie.src, movie.title);
}

// --- Modale vidéo stylée ---
function openPlayer(src, title) {
  const modal = document.getElementById("playerModal");
  const player = document.getElementById("player");
  const modalTitle = document.getElementById("modalTitle");

  modalTitle.textContent = title;
  player.src = src;

  modal.style.display = "block";
  player.play();

  document.getElementById("closeBtn").onclick = () => {
    player.pause();
    modal.style.display = "none";
  };
}

// --- Ferme la modale si clic à l’extérieur ---
window.onclick = function(event) {
  const modal = document.getElementById("playerModal");
  if (event.target == modal) {
    document.getElementById("player").pause();
    modal.style.display = "none";
  }
};
