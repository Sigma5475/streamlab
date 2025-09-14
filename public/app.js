import React, { useEffect, useState } from "react";
import catalogueData from "./catalogue.json";
import "./App.css";

function App() {
  const [catalogue, setCatalogue] = useState({ series: [], movies: [] });
  const [currentMain, setCurrentMain] = useState(null); // Série ou Film affichée
  const [currentVideo, setCurrentVideo] = useState(null); // Src vidéo en cours

  // --- Charger le catalogue ---
  useEffect(() => {
    setCatalogue(catalogueData);
  }, []);

  // --- Sauvegarder progression ---
  const saveProgress = (id, season, episode, time) => {
    const progress = { season, episode, time };
    localStorage.setItem("progress_" + id, JSON.stringify(progress));
    localStorage.setItem(
      "lastSeries",
      JSON.stringify({ id, season, episode })
    );
  };

  // --- Lecture vidéo ---
  const playVideo = (src, seriesInfo) => {
    setCurrentVideo({ src, seriesInfo });
    if (seriesInfo) {
      saveProgress(
        seriesInfo.id,
        seriesInfo.season,
        seriesInfo.episode,
        0
      );
    }
  };

  // --- Affichage d’une série ---
  const showSeries = (series) => {
    setCurrentMain(
      <div>
        <h2>{series.title}</h2>
        {series.seasons.map((season) => (
          <div key={season.season}>
            <h3>Saison {season.season}</h3>
            {season.episodes.map((ep) => (
              <div key={ep.episode} className="episode">
                <button
                  onClick={() =>
                    playVideo(ep.src, {
                      id: series.id,
                      season: season.season,
                      episode: ep.episode,
                    })
                  }
                >
                  {ep.episode}. {ep.title}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // --- Affichage d’un film ---
  const showMovie = (movie) => {
    setCurrentMain(
      <div>
        <h2>{movie.title}</h2>
        <button onClick={() => playVideo(movie.src, null)}>▶️ Lire le film</button>
      </div>
    );
  };

  // --- Affichage du catalogue ---
  return (
    <div className="app">
      <h1>Catalogue</h1>
      <div id="catalogue">
        {/* Séries */}
        <h2>Séries</h2>
        <div className="series-list">
          {catalogue.series.map((series) => {
            const progress = JSON.parse(
              localStorage.getItem("progress_" + series.id) || "{}"
            );
            return (
              <div
                key={series.id}
                className="card serie-card"
                onClick={() => showSeries(series)}
              >
                <img src={series.image} alt={series.title} width="150" />
                <div className="title">{series.title}</div>
                {progress.episode && (
                  <div className="now-playing">
                    En cours : S{progress.season}E{progress.episode}{" "}
                    {progress.time ? `(${Math.floor(progress.time / 60)} min)` : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Films */}
        <h2>Films</h2>
        <div className="movies-list">
          {catalogue.movies.map((movie) => (
            <div
              key={movie.id}
              className="card movie-card"
              onClick={() => showMovie(movie)}
            >
              <img src={movie.image} alt={movie.title} width="150" />
              <div className="title">{movie.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section principale */}
      <main>
        {currentMain}
        {currentVideo && (
          <div className="video-player">
            <video
              controls
              autoPlay
              width="100%"
              onTimeUpdate={(e) => {
                const currentTime = e.target.currentTime;
                if (currentVideo.seriesInfo) {
                  const { id, season, episode } = currentVideo.seriesInfo;
                  saveProgress(id, season, episode, currentTime);
                }
              }}
            >
              <source src={currentVideo.src} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
