// server.js
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());


// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));


// Serve catalog.json and simple API
const catalog = require('./catalog.json');


// Simple in-memory watchlists per-session (for demo only)
let watchlists = {}; // { userId: [ {seriesId, season, episode} ] }


app.get('/api/catalog', (req, res) => {
res.json(catalog);
});


app.get('/api/series/:seriesId', (req, res) => {
const s = catalog.series.find(x => x.id === req.params.seriesId);
if(!s) return res.status(404).json({error: 'Série introuvable'});
res.json(s);
});


// Watchlist endpoints (demo: no auth, userId passed as header or query)
function getUserId(req){
return req.headers['x-user-id'] || req.query.userId || 'guest';
}


app.get('/api/watchlist', (req, res) => {
const uid = getUserId(req);
res.json(watchlists[uid] || []);
});


app.post('/api/watchlist', (req, res) => {
const uid = getUserId(req);
const item = req.body; // { seriesId, season, episode }
if(!watchlists[uid]) watchlists[uid] = [];
// naive dedupe
const exists = watchlists[uid].find(w => w.seriesId===item.seriesId && w.season===item.season && w.episode===item.episode);
if(!exists) watchlists[uid].push(item);
res.json(watchlists[uid]);
});


app.delete('/api/watchlist', (req, res) => {
const uid = getUserId(req);
const item = req.body; // { seriesId, season, episode }
if(!watchlists[uid]) return res.json([]);
watchlists[uid] = watchlists[uid].filter(w => !(w.seriesId===item.seriesId && w.season===item.season && w.episode===item.episode));
res.json(watchlists[uid]);
});


// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
