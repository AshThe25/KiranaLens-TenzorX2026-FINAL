/**
 * KiranaLens Scoring Engine
 *
 * Combines vision signals + geo signals into:
 *   - Daily/monthly revenue ranges
 *   - Confidence score
 *   - Risk classification
 *   - Fraud flags
 *   - Credit recommendation
 *
 * Formula:
 *   Raw Score = w1*SDI + w2*SKU_norm + w3*InvVal_norm + w4*Footfall + w5*Catchment - w6*Competition_penalty
 */

const WEIGHTS = {
  shelfDensity:    0.28,
  skuDiversity:    0.22,
  inventoryValue:  0.18,
  footfall:        0.16,
  catchment:       0.10,
  competition:     0.06,  // penalty weight
};

// Empirical calibration constants (derived from kirana market research)
const DAILY_SALES_PER_SCORE_POINT = 320;   // ₹ per 0.01 score
const MARGIN_RATE = 0.18;                   // avg kirana net margin
const UNCERTAINTY_BAND = 0.22;             // ±22% for ranges

function normalize(value, min, max) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function round0(n) { return Math.round(n); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

function computeScore(vision, geo, meta) {
  // ── 1. Normalize all signals to [0, 1] ──────────────────────
  const sdi         = vision.shelfDensityIndex;                     // already 0–1
  const skuNorm     = normalize(vision.skuDiversityCount, 200, 2000);
  const invNorm     = normalize(vision.inventoryValueEstimate, 50000, 600000);
  const footfall    = geo.footfallProxyIndex;                       // already 0–1
  const catchment   = geo.catchmentDensityScore;                    // already 0–1
  const competition = geo.competitionDensityScore;                  // already 0–1

  // ── 2. Raw composite score ───────────────────────────────────
  const rawScore =
    WEIGHTS.shelfDensity   * sdi       +
    WEIGHTS.skuDiversity   * skuNorm   +
    WEIGHTS.inventoryValue * invNorm   +
    WEIGHTS.footfall       * footfall  +
    WEIGHTS.catchment      * catchment -
    WEIGHTS.competition    * Math.max(0, competition - 0.6); // penalty only if too much competition

  const compositeScore = clamp(rawScore, 0, 1);

  // ── 3. Confidence score ─────────────────────────────────────
  // Higher confidence with more images, no fraud flags, non-extreme scores
  const imageCoverageFactor = Math.min(meta.imageCount / 4, 1);
  const fraudSignals = Array.isArray(vision.fraudSignals) ? vision.fraudSignals : [];
  const fraudPenalty = fraudSignals.length * 0.08;
  const extremePenalty = (compositeScore > 0.95 || compositeScore < 0.15) ? 0.05 : 0;
  const confidence = clamp(
    0.55 + (imageCoverageFactor * 0.30) + (compositeScore * 0.10) - fraudPenalty - extremePenalty,
    0.45, 0.94
  );

  // ── 4. Revenue estimation ────────────────────────────────────
  const baseDailySales = clamp(
    compositeScore * DAILY_SALES_PER_SCORE_POINT * 100,
    2000, 45000
  );
  const band = baseDailySales * UNCERTAINTY_BAND;

  const dailySalesLow  = round0(baseDailySales - band);
  const dailySalesHigh = round0(baseDailySales + band);
  const monthlyRevLow  = round0(dailySalesLow  * 26); // ~26 operating days/month
  const monthlyRevHigh = round0(dailySalesHigh * 26);
  const monthlyIncLow  = round0(monthlyRevLow  * MARGIN_RATE);
  const monthlyIncHigh = round0(monthlyRevHigh * MARGIN_RATE);

  // ── 5. Risk classification ───────────────────────────────────
  let riskLevel, riskLabel;
  if (compositeScore >= 0.70) {
    riskLevel = 'LOW';   riskLabel = 'Low Risk';
  } else if (compositeScore >= 0.45) {
    riskLevel = 'MEDIUM'; riskLabel = 'Moderate Risk';
  } else {
    riskLevel = 'HIGH';  riskLabel = 'High Risk';
  }

  // ── 6. Credit recommendation ─────────────────────────────────
  let recommendation, recommendationLabel;
  const hasCriticalFraud = fraudSignals.some(f => f.confidence > 0.75);

  if (hasCriticalFraud) {
    recommendation = 'NEEDS_VERIFICATION';
    recommendationLabel = 'Needs Field Verification';
  } else if (riskLevel === 'LOW' && confidence >= 0.65) {
    recommendation = 'PRE_APPROVE';
    recommendationLabel = 'Pre-Approve';
  } else if (riskLevel === 'MEDIUM' || confidence < 0.65) {
    recommendation = 'REVIEW';
    recommendationLabel = 'Manual Review';
  } else {
    recommendation = 'DECLINE';
    recommendationLabel = 'Decline';
  }

  // ── 7. Max eligible loan amount ──────────────────────────────
  const monthlyIncMid  = (monthlyIncLow + monthlyIncHigh) / 2;
  const maxLoanAmount  = round0(monthlyIncMid * 18 * (compositeScore * 0.4 + 0.6));
  const suggestedEMI   = round0(maxLoanAmount / 18);

  // ── 8. Signal breakdown (explainability) ────────────────────
  const signalBreakdown = [
    { signal: 'Shelf Density Index',    score: Math.round(sdi * 100),      weight: '28%', impact: sdi > 0.7 ? 'positive' : 'neutral' },
    { signal: 'SKU Diversity',          score: Math.round(skuNorm * 100),  weight: '22%', impact: skuNorm > 0.5 ? 'positive' : 'negative' },
    { signal: 'Inventory Value',        score: Math.round(invNorm * 100),  weight: '18%', impact: invNorm > 0.4 ? 'positive' : 'neutral' },
    { signal: 'Footfall Proxy',         score: Math.round(footfall * 100), weight: '16%', impact: footfall > 0.5 ? 'positive' : 'negative' },
    { signal: 'Catchment Density',      score: Math.round(catchment * 100),weight: '10%', impact: catchment > 0.5 ? 'positive' : 'neutral' },
    { signal: 'Competition Pressure',   score: Math.round(competition * 100),weight: '6%', impact: competition > 0.6 ? 'negative' : 'neutral' },
  ];

  // ── 9. Fraud analysis ────────────────────────────────────────
  const allFraudSignals = [
    ...fraudSignals,
    // Geo cross-validation
    ...(sdi > 0.88 && geo.footfallProxyIndex < 0.30
      ? [{ type: 'INVENTORY_FOOTFALL_MISMATCH', confidence: 0.74, detail: 'High shelf density in low-footfall area' }]
      : []),
    ...(meta.imageCount === 1
      ? [{ type: 'LIMITED_VIEW_COVERAGE', confidence: 0.65, detail: 'Single image limits assessment accuracy' }]
      : []),
  ];

  // ── 10. Final output ─────────────────────────────────────────
  return {
    assessment_id: meta.assessmentId,
    timestamp: meta.timestamp,
    location: {
      name: meta.locationName,
      lat: meta.lat,
      lng: meta.lng,
      nearestCity: geo.nearestCity || null,
    },

    // Core outputs
    daily_sales_range:    [dailySalesLow, dailySalesHigh],
    monthly_revenue_range:[monthlyRevLow, monthlyRevHigh],
    monthly_income_range: [monthlyIncLow, monthlyIncHigh],
    confidence_score:     Math.round(confidence * 100) / 100,
    composite_score:      Math.round(compositeScore * 100) / 100,
    risk_level:           riskLevel,
    risk_label:           riskLabel,
    recommendation:       recommendation,
    recommendation_label: recommendationLabel,

    // Loan eligibility
    loan_eligibility: {
      max_amount:    maxLoanAmount,
      suggested_emi: suggestedEMI,
      tenure_months: 18,
      eligible:      recommendation === 'PRE_APPROVE',
    },

    // Signal detail
    vision_signals: {
      shelf_density_index:     vision.shelfDensityIndex,
      sku_diversity_count:     vision.skuDiversityCount,
      inventory_value_estimate:vision.inventoryValueEstimate,
      refill_velocity_score:   vision.refillVelocityScore,
      refill_velocity_label:   vision.refillVelocityLabel,
      category_breakdown:      vision.categoryBreakdown,
      coverage_score:          vision.coverageScore,
      source:                  vision.source,
    },
    geo_signals: {
      catchment_density:       geo.catchmentDensityScore,
      footfall_proxy_index:    geo.footfallProxyIndex,
      competition_density:     geo.competitionDensityScore,
      competitor_count:        geo.estimatedCompetitorCount,
      road_type:               geo.roadType,
      poi_proximity_score:     geo.poiProximityScore,
      catchment_pop_estimate:  geo.catchmentPopEstimate,
      source:                  geo.source,
    },

    // Explainability
    signal_breakdown: signalBreakdown,
    fraud_flags:      allFraudSignals,

    // Meta
    processing_info: {
      images_analyzed: meta.imageCount,
      vision_source:   vision.source,
      geo_source:      geo.source,
      model_version:   '1.0.0',
    }
  };
}

module.exports = { computeScore };
