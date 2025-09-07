// Sélecteurs DOM
const seriesContainer = document.getElementById('seriesContainer');
const searchInput = document.getElementById('search');
const modalTitle = document.getElementById('modalTitle');
const playerModal = document.getElementById('playerModal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');

// Variable globale pour stocker le catalogue
let catalog = { series: [] };

// Fonction pour afficher le catalogue
function renderCatalog(data) {
  seriesContainer.innerHTML = ''; // Vide le conteneur

  if (!data.series || data.series.length === 0) {
    seriesContainer.innerHTML = '<div>Aucune série trouvée.</div>';
    return;
  }

  data.series.forEach(series => {
    const seriesDiv = document.createElement('div');
    seriesDiv.className = 'row';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = series.title;
    seriesDiv.appendChild(titleDiv);

    series.seasons.forEach(season => {
      season.episodes.forEach(ep => {
        const card = document.createElement('div');
        card.className = 'card';

        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = `<img src="https://via.placeholder.com/400x225.png?text=${encodeURIComponent('Ep '+ep.episode)}"
            style="width:100%;height:100%;object-fit:cover;border-radius:8px">`;

        const etitle = document.createElement('div');
        etitle.className = 'title';
        etitle.textContent = `Épisode ${ep.episode} — ${ep.title}`;

        const btnPlay = document.createElement('button');
        btnPlay.className = 'btn';
        btnPlay.textContent = '▶ Lecture';
        btnPlay.onclick = () => {
          openPlayer(series.title + ' S' + season.season + 'E' + ep.episode, ep.src);
        };

        card.appendChild(thumb);
        card.appendChild(etitle);
        card.appendChild(btnPlay);

        seriesDiv.appendChild(card);
      });
    });

    seriesContainer.appendChild(seriesDiv);
  });
}

// Fonction pour ouvrir le lecteur
function openPlayer(title, src) {
  modalTitle.textContent = title;
  player.src = src;
  playerModal.classList.add('open');
  player.play();
}

// Fermeture du lecteur
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
      s.seasons.some(se => se.episodes.some(ep => ep.title.toLowerCase().includes(q)))
    )
  };
  renderCatalog(filtered);
});

// Fonction de chargement du catalogue depuis l'API
function loadCatalog() {
  fetch('/catalog.json')
    .then(res => res.json())
    .then(data => {
      catalog = data;
      renderCatalog(catalog);
    })
    .catch(err => {
      seriesContainer.innerHTML = "<div>Erreur de chargement du catalogue.</div>";
      console.error("Erreur chargement catalogue:", err);
    });
}

// Initialisation
loadCatalog();
