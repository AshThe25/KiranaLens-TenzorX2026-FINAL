require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { analyzeImages } = require('./services/vision');
const { getGeoSignals } = require('./services/geo');
const { computeScore } = require('./services/scoring');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend from backend directory (HTML files co-located for deployment)
app.use(express.static(__dirname));

// ── Multer (image upload, memory) ───────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB per file, max 5
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// ── In-memory store for demo (replace with MongoDB in prod) ─
const assessments = new Map();

// ── POST /api/assess ────────────────────────────────────────
app.post('/api/assess', upload.array('images', 5), async (req, res) => {
  try {
    const { lat, lng, location_name } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }
    if (!lat || !lng) {
      return res.status(400).json({ error: 'GPS coordinates are required' });
    }

    const assessmentId = 'KL-' + uuidv4().slice(0, 8).toUpperCase();

    // Run vision + geo in parallel
    const [visionSignals, geoSignals] = await Promise.all([
      analyzeImages(files),
      getGeoSignals(parseFloat(lat), parseFloat(lng))
    ]);

    // Compute final score
    const result = computeScore(visionSignals, geoSignals, {
      assessmentId,
      locationName: location_name || 'Unknown Location',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      imageCount: files.length,
      timestamp: new Date().toISOString()
    });

    // Store result
    assessments.set(assessmentId, result);

    res.json(result);
  } catch (err) {
    console.error('Assessment error:', err);
    res.status(500).json({ error: err.message || 'Assessment failed' });
  }
});

// ── GET /api/assess/:id ─────────────────────────────────────
app.get('/api/assess/:id', (req, res) => {
  const result = assessments.get(req.params.id);
  if (!result) return res.status(404).json({ error: 'Assessment not found' });
  res.json(result);
});

// ── GET /api/health ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    vision_api: !!process.env.GOOGLE_VISION_API_KEY ? 'google_vision' : 'simulation',
    geo_api: !!process.env.GOOGLE_MAPS_API_KEY ? 'google_maps' : 'simulation',
    assessments_served: assessments.size
  });
});

// ── Catch-all → serve frontend ──────────────────────────────
app.get('*', (req, res) => {
  // serve assess.html for /assess or /assess.html, otherwise index.html
  if (req.path === '/assess' || req.path === '/assess.html') {
    return res.sendFile(path.join(__dirname, 'assess.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Global error middleware ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Handle multer errors
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 10MB per image.' });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files. Max 5 images.' });
  }
  if (err && err.message === 'Only image files allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('\nKiranaLens backend running');
  console.log('  Landing page: http://localhost:' + PORT);
  console.log('  Assess tool:  http://localhost:' + PORT + '/assess.html');
  console.log('  Health check: http://localhost:' + PORT + '/api/health');
  console.log('  Vision API:   ' + (process.env.GOOGLE_VISION_API_KEY ? 'Google Vision' : 'Smart Simulation'));
  console.log('  Geo API:      ' + (process.env.GOOGLE_MAPS_API_KEY    ? 'Google Maps'   : 'Geo Simulation') + '\n');
});
