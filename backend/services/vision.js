/**
 * Vision Service
 * Uses Google Vision API if key is set, otherwise runs smart simulation
 * based on real image metadata (size, count, entropy proxy)
 */

const fetch = require('node-fetch');

// ── Google Vision API ────────────────────────────────────────
async function callGoogleVision(imageBuffer) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  const b64 = imageBuffer.toString('base64');

  const body = {
    requests: [{
      image: { content: b64 },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 30 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
        { type: 'TEXT_DETECTION', maxResults: 10 },
      ]
    }]
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
  );
  return res.json();
}

// ── Label → category mapping ─────────────────────────────────
const PRODUCT_CATEGORIES = {
  fmcg: ['bottle', 'packaging', 'label', 'product', 'grocery', 'food', 'beverage', 'snack', 'chips', 'biscuit', 'soap', 'shampoo', 'oil', 'rice', 'flour', 'sugar', 'salt', 'spice', 'detergent', 'toothpaste'],
  staples: ['rice', 'flour', 'grain', 'lentil', 'cereal', 'wheat', 'maize', 'sack', 'bag'],
  highMargin: ['chocolate', 'candy', 'biscuit', 'chips', 'namkeen', 'noodle', 'sauce', 'drink', 'juice'],
  household: ['soap', 'detergent', 'shampoo', 'toothbrush', 'utensil', 'mop', 'bucket', 'candle'],
  shelf: ['shelf', 'rack', 'row', 'display', 'store', 'shop', 'retail', 'merchandise'],
};

function categorizeLabels(labels) {
  const detected = { fmcg: 0, staples: 0, highMargin: 0, household: 0, shelfPresence: 0 };
  const lowerLabels = labels.map(l => l.toLowerCase());

  for (const [cat, keywords] of Object.entries(PRODUCT_CATEGORIES)) {
    const key = cat === 'shelf' ? 'shelfPresence' : cat;
    detected[key] = lowerLabels.filter(l => keywords.some(k => l.includes(k))).length;
  }
  return detected;
}

// ── Smart simulation (no API key) ───────────────────────────
function simulateVisionAnalysis(files) {
  // Use real signals from the actual uploaded images:
  // file size → inventory density proxy (larger files = more detailed/stocked shelves)
  // file count → multi-angle coverage
  // Buffer entropy proxy → visual complexity

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const avgSize = totalSize / files.length;
  const imageCount = files.length;

  // Compute entropy-like measure from first few bytes of each image
  // (variation in pixel values = shelf complexity)
  const entropies = files.map(f => {
    if (!f.buffer || f.buffer.length < 102) return 40; // safe default if buffer too small
    const sample = f.buffer.slice(100, Math.min(600, f.buffer.length));
    if (sample.length < 2) return 40;
    let variance = 0;
    for (let i = 1; i < sample.length; i++) {
      variance += Math.abs(sample[i] - sample[i - 1]);
    }
    const result = variance / sample.length;
    return isFinite(result) ? result : 40;
  });
  const avgEntropy = entropies.length > 0
    ? entropies.reduce((a, b) => a + b, 0) / entropies.length
    : 40;

  // Normalize signals to 0–1
  const sizeFactor    = Math.min(avgSize / (3 * 1024 * 1024), 1);       // 3MB = fully stocked
  const coverageFactor = Math.min(imageCount / 5, 1);                    // 5 images = full coverage
  const complexityFactor = Math.min(avgEntropy / 80, 1);                 // high entropy = stocked

  // Seeded pseudo-random for consistent results per assessment
  const seed = isFinite(avgSize) && avgSize > 0 ? (avgSize % 1000) / 1000 : 0.5;

  const shelfDensity  = clamp(0.55 + sizeFactor * 0.30 + (seed * 0.10), 0.45, 0.97);
  const skuDiversity  = Math.floor(clamp(600 + (sizeFactor * 900) + (complexityFactor * 300) + (seed * 200), 400, 1800));
  const inventoryVal  = Math.floor(clamp(80000 + (shelfDensity * 350000) + (seed * 100000), 60000, 550000));
  const refillSignal  = clamp(0.3 + (complexityFactor * 0.6) + (coverageFactor * 0.1), 0.2, 0.95);

  const categories = {
    fmcg:     Math.floor(skuDiversity * 0.35),
    staples:  Math.floor(skuDiversity * 0.25),
    highMargin: Math.floor(skuDiversity * 0.20),
    household: Math.floor(skuDiversity * 0.20),
  };

  // Fraud signals
  const fraudFlags = [];
  // If very high inventory but low complexity → shelf-stuffing possible
  if (shelfDensity > 0.88 && complexityFactor < 0.4) {
    fraudFlags.push({ type: 'POSSIBLE_SHELF_STUFFING', confidence: 0.61 });
  }
  // Only 1 image → location bias risk
  if (imageCount === 1) {
    fraudFlags.push({ type: 'INSUFFICIENT_COVERAGE', confidence: 0.80 });
  }

  return {
    source: 'simulation',
    shelfDensityIndex: round2(shelfDensity),
    skuDiversityCount: skuDiversity,
    inventoryValueEstimate: inventoryVal,
    refillVelocityScore: round2(refillSignal),
    refillVelocityLabel: refillSignal > 0.7 ? 'High' : refillSignal > 0.4 ? 'Medium' : 'Low',
    categoryBreakdown: categories,
    imageCount,
    fraudSignals: fraudFlags,
    coverageScore: round2(coverageFactor),
  };
}

// ── Parse Google Vision response ─────────────────────────────
function parseVisionResponse(responses, files) {
  const allLabels = [];
  const allObjects = [];

  for (const resp of responses) {
    if (resp.labelAnnotations) {
      allLabels.push(...resp.labelAnnotations.map(l => l.description));
    }
    if (resp.localizedObjectAnnotations) {
      allObjects.push(...resp.localizedObjectAnnotations.map(o => o.name));
    }
  }

  const categories = categorizeLabels([...allLabels, ...allObjects]);
  const uniqueLabels = new Set([...allLabels, ...allObjects]);

  // Estimate shelf density from "shelf" label confidence
  const shelfLabels = allLabels.filter(l => PRODUCT_CATEGORIES.shelf.some(k => l.toLowerCase().includes(k)));
  const shelfDensity = clamp(0.5 + (shelfLabels.length / 10) + (categories.fmcg / 40), 0.4, 0.97);

  // SKU count proxy
  const skuDiversity = Math.floor(clamp(uniqueLabels.size * 28, 300, 1800));
  const inventoryVal = Math.floor(shelfDensity * 420000);
  const refillSignal = clamp(0.4 + (categories.fmcg / 30), 0.2, 0.95);

  const fraudFlags = [];
  if (shelfDensity > 0.9 && files.length < 3) {
    fraudFlags.push({ type: 'POSSIBLE_SHELF_STUFFING', confidence: 0.58 });
  }

  return {
    source: 'google_vision',
    shelfDensityIndex: round2(shelfDensity),
    skuDiversityCount: skuDiversity,
    inventoryValueEstimate: inventoryVal,
    refillVelocityScore: round2(refillSignal),
    refillVelocityLabel: refillSignal > 0.7 ? 'High' : refillSignal > 0.4 ? 'Medium' : 'Low',
    categoryBreakdown: {
      fmcg:       categories.fmcg * 30,
      staples:    categories.staples * 25,
      highMargin: categories.highMargin * 20,
      household:  categories.household * 20,
    },
    imageCount: files.length,
    detectedLabels: [...uniqueLabels].slice(0, 20),
    fraudSignals: fraudFlags,
    coverageScore: round2(Math.min(files.length / 5, 1)),
  };
}

// ── Main export ──────────────────────────────────────────────
async function analyzeImages(files) {
  if (process.env.GOOGLE_VISION_API_KEY) {
    try {
      const responses = await Promise.all(
        files.map(f => callGoogleVision(f.buffer).then(r => r.responses?.[0] || {}))
      );
      return parseVisionResponse(responses, files);
    } catch (err) {
      console.warn('Google Vision API failed, falling back to simulation:', err.message);
    }
  }
  return simulateVisionAnalysis(files);
}

// ── Helpers ──────────────────────────────────────────────────
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function round2(n) { return Math.round(n * 100) / 100; }

module.exports = { analyzeImages };
