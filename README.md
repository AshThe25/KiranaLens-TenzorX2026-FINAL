# KiranaLens 🔍
### Remote Cash Flow Underwriting for Kirana Stores using Vision & Geo Intelligence

> **TenzorX 2026 · Poonawalla Fincorp · Problem Statement 4C**

KiranaLens turns a smartphone into a credit underwriting tool. Upload 3–5 photos of any kirana store + drop a GPS pin → get an AI-generated cash flow estimate, risk score, and credit recommendation in under 60 seconds.

**No field visits. No documents. No waiting.**

---

## 🚀 Run Locally (2 minutes)

```bash
git clone https://github.com/AshThe25/KiranaLens-TenzorX2026-FINAL
cd KiranaLens-TenzorX2026-FINAL/backend
npm install
node server.js
```

Open **http://localhost:8080** → full app running instantly.

> No API keys needed. Smart simulation handles everything out of the box.

---

## 🏗️ Architecture

```
┌─────────────────────┐
│  Frontend (HTML/JS) │  ← index.html + assess.html
└──────────┬──────────┘
           │ POST /api/assess (multipart images + GPS)
┌──────────▼──────────┐
│  Node.js + Express  │  ← backend/server.js
└──────┬──────┬───────┘
       │      │
┌──────▼──┐ ┌─▼────────────┐
│ Vision  │ │ Geo Service  │
│ Service │ │              │
│         │ │ Google Maps  │
│ Google  │ │ API / Smart  │
│ Vision  │ │ Simulation   │
│ API /   │ └─────────────-┘
│ Smart   │
│ Simul.  │
└──────┬──┘
       │
┌──────▼──────────────┐
│   Scoring Engine    │  ← Weighted composite model
│                     │
│ SDI (28%) + SKU     │
│ (22%) + Inv (18%)   │
│ + Footfall (16%)    │
│ + Catchment (10%)   │
│ - Competition (6%)  │
└─────────────────────┘
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/AshThe25/KiranaLens-TenzorX2026-FINAL
cd KiranaLens-TenzorX2026-FINAL/backend
npm install
```

### 2. Configure (optional)

```bash
cp .env.example .env
# Add GOOGLE_VISION_API_KEY and GOOGLE_MAPS_API_KEY if you have them
# Works perfectly WITHOUT API keys using built-in smart simulation
```

### 3. Run

```bash
node server.js
# or: npm start
```

Open **http://localhost:5000** → full app running.

---

## 🧠 How It Works

### Layer 1 — Vision Intelligence

Analyzes uploaded store photos to extract:

| Signal | Description | Weight |
|--------|-------------|--------|
| **Shelf Density Index (SDI)** | % of shelf space occupied → working capital proxy | 28% |
| **SKU Diversity Score** | Distinct product categories detected | 22% |
| **Inventory Value Estimate** | Products mapped to price bands | 18% |
| **Refill Velocity Signal** | Partially empty = recent demand | Supplementary |

Uses **Google Vision API** (label detection + object localization) if key is set.
Falls back to **smart image analysis** using file size, pixel entropy, and image metadata.

### Layer 2 — Geo-Spatial Intelligence

From GPS coordinates:

| Signal | Description | Weight |
|--------|-------------|--------|
| **Catchment Density** | Population within 500m radius | 10% |
| **Footfall Proxy Index** | Road type, nearby schools/transit | 16% |
| **Competition Density** | Nearby kirana count (moderate=good, excess=flag) | 6% (penalty) |

Uses **Google Maps Places API** if key is set. Falls back to coordinate-based simulation using a database of 12 major Indian city profiles.

### Layer 3 — Scoring Engine

```
Composite Score = 0.28×SDI + 0.22×SKU_norm + 0.18×InvVal_norm
               + 0.16×Footfall + 0.10×Catchment
               - 0.06×max(0, Competition - 0.60)
```

Outputs:
- **Daily sales range** (with ±22% uncertainty band)
- **Monthly revenue + income range**
- **Confidence score** (0–1, based on image coverage + fraud signals)
- **Risk level** (LOW / MEDIUM / HIGH)
- **Credit recommendation** (PRE_APPROVE / REVIEW / NEEDS_VERIFICATION / DECLINE)
- **Max loan eligibility** (based on monthly income × 18 months × confidence factor)

### Fraud Detection

Three cross-validation checks:
1. **Shelf-Stuffing** — High SDI + low image entropy → borrowed inventory flag
2. **Inventory-Footfall Mismatch** — SDI > 0.88 in low-footfall geo zone → fraud signal
3. **Coverage Bias** — Single image submitted → insufficient coverage flag

---

## 📡 API Reference

### `POST /api/assess`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File[] | ✅ | 1–5 store photos (JPG/PNG/WEBP) |
| `lat` | Number | ✅ | GPS latitude |
| `lng` | Number | ✅ | GPS longitude |
| `location_name` | String | ❌ | Human-readable location |

**Response:**

```json
{
  "assessment_id": "KL-A3F8B2C1",
  "daily_sales_range": [6200, 9100],
  "monthly_revenue_range": [161200, 236600],
  "monthly_income_range": [29016, 42588],
  "confidence_score": 0.76,
  "composite_score": 0.71,
  "risk_level": "LOW",
  "recommendation": "PRE_APPROVE",
  "loan_eligibility": {
    "max_amount": 650000,
    "suggested_emi": 36111,
    "tenure_months": 18,
    "eligible": true
  },
  "vision_signals": { ... },
  "geo_signals": { ... },
  "signal_breakdown": [ ... ],
  "fraud_flags": []
}
```

### `GET /api/assess/:id`

Retrieve a previous assessment by ID.

### `GET /api/health`

```json
{
  "status": "online",
  "vision_api": "simulation",
  "geo_api": "simulation",
  "assessments_served": 3
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS + Tailwind CDN |
| Backend | Node.js + Express |
| Image Upload | Multer (memory storage) |
| Vision AI | Google Vision API / Smart Simulation |
| Geo Intelligence | Google Maps API / Coordinate-based Simulation |
| Scoring | Custom weighted model (no ML framework needed) |

---

## 📁 Project Structure

```
KiranaLens/
├── index.html          ← Landing page (Apple-style, animations)
├── assess.html         ← Assessment tool (upload + results)
├── backend/
│   ├── server.js       ← Express server + API routes
│   ├── package.json
│   ├── .env.example
│   └── services/
│       ├── vision.js   ← Google Vision API + simulation
│       ├── geo.js      ← Google Maps API + simulation
│       └── scoring.js  ← Weighted composite scoring engine
└── README.md
```

---

## 🏆 Built For

**TenzorX 2026 National AI Hackathon**
Poonawalla Fincorp · Problem Statement 4C
*Remote Cash Flow Underwriting for Kirana Stores using Vision & Geo Intelligence*

---

## 👤 Team

Built by **Aishwarya Tripathi** · VIT Vellore
