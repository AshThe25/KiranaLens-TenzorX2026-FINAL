import { Link } from 'react-router-dom'
import { ArrowRight, Eye, MapPin, Shield, Zap, TrendingUp, Camera, CheckCircle } from 'lucide-react'

const STATS = [
  { value: '13M+', label: 'Kirana Stores in India' },
  { value: '₹5.5L Cr', label: 'Unmet Credit Demand' },
  { value: '60s', label: 'Assessment Time' },
  { value: '98%', label: 'Cost Reduction vs Field Visit' },
]

const HOW_IT_WORKS = [
  { icon: Camera, step: '01', title: 'Upload 3–5 Store Photos', desc: 'Interior shelves, counter area, exterior storefront' },
  { icon: MapPin, step: '02', title: 'Drop a Pin', desc: 'GPS coordinates unlock geo-spatial demand intelligence' },
  { icon: Eye, step: '03', title: 'AI Scans & Scores', desc: 'Vision model extracts SDI, SKU diversity, inventory value, refill signals' },
  { icon: TrendingUp, step: '04', title: 'Instant Credit Decision', desc: 'Confidence-banded output with full explainability in under 60 seconds' },
]

const SIGNALS = [
  { color: 'bg-gold', label: 'Shelf Density Index', desc: 'Working capital proxy' },
  { color: 'bg-blue-500', label: 'SKU Diversity Score', desc: 'Footfall capture signal' },
  { color: 'bg-purple-500', label: 'Inventory Value Approx.', desc: 'Revenue velocity proxy' },
  { color: 'bg-green-500', label: 'Catchment Density', desc: 'Demand baseline' },
  { color: 'bg-pink-500', label: 'Footfall Proxy Index', desc: 'Traffic multiplier' },
  { color: 'bg-orange-500', label: 'Competition Density', desc: 'Margin signal' },
]

export default function Landing() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-8 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(245,166,35,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,166,35,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <div className="flex-1 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-gold/30 text-gold text-xs font-mono mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                TenzorX 2026 · Problem Statement 4C
              </div>

              <h1 className="text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
                <span className="text-white">See the</span>
                <br />
                <span className="text-gradient">Store.</span>
                <br />
                <span className="text-white">Know the</span>
                <br />
                <span className="text-gradient">Cash Flow.</span>
              </h1>

              <p className="text-white/60 text-xl leading-relaxed mb-10 max-w-lg">
                AI-powered kirana store underwriting using computer vision and
                geo-intelligence. No field visits. No documents. No waiting.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  to="/assess"
                  className="group flex items-center gap-3 px-8 py-4 bg-gold hover:bg-gold-light text-navy font-bold text-lg rounded-xl transition-all hover:glow-gold hover:scale-105"
                >
                  Start Assessment
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://github.com"
                  className="flex items-center gap-2 px-6 py-4 glass border border-white/10 hover:border-gold/30 text-white/80 hover:text-white font-medium rounded-xl transition-all"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Right — Live mock terminal */}
            <div className="flex-1 w-full">
              <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-white/30 text-xs font-mono">kiranelens · output</span>
                </div>
                <div className="p-6 font-mono text-sm">
                  <div className="text-white/40 mb-4 text-xs">// Assessment Result — Store ID: KL-2847</div>
                  <pre className="text-green-400 leading-7">{`{
  `}<span className="text-blue-400">"store_id"</span>{`: `}<span className="text-gold">"KL-2847"</span>{`,
  `}<span className="text-blue-400">"location"</span>{`: `}<span className="text-gold">"Dharavi, Mumbai"</span>{`,
  `}<span className="text-blue-400">"daily_sales_range"</span>{`: [
    `}<span className="text-green-300">6800</span>{`, `}<span className="text-green-300">9200</span>{`
  ],
  `}<span className="text-blue-400">"monthly_revenue_range"</span>{`: [
    `}<span className="text-green-300">204000</span>{`, `}<span className="text-green-300">276000</span>{`
  ],
  `}<span className="text-blue-400">"confidence_score"</span>{`: `}<span className="text-green-300">0.78</span>{`,
  `}<span className="text-blue-400">"risk_level"</span>{`: `}<span className="text-green-400">"LOW"</span>{`,
  `}<span className="text-blue-400">"risk_flags"</span>{`: [],
  `}<span className="text-blue-400">"recommendation"</span>{`: `}<span className="text-gold font-bold">"PRE-APPROVE"</span>{`
}`}</pre>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 font-bold">Decision generated in 4.2s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/2 py-10">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.value} className="text-center">
              <div className="text-4xl font-black text-gradient mb-1">{s.value}</div>
              <div className="text-white/40 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-gold font-mono text-sm mb-3">// HOW IT WORKS</div>
            <h2 className="text-4xl font-black text-white">From photos to credit decision<br /><span className="text-gradient">in 60 seconds.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="glass rounded-2xl p-6 border border-white/8 hover:border-gold/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <span className="text-white/20 font-mono text-2xl font-black">{step}</span>
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signals */}
      <section className="py-16 px-8 bg-white/2 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-gold font-mono text-sm mb-3">// SIGNAL INTELLIGENCE</div>
            <h2 className="text-3xl font-black text-white">6 signals. One credit score.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SIGNALS.map(s => (
              <div key={s.label} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
                <div>
                  <div className="text-white text-sm font-semibold">{s.label}</div>
                  <div className="text-white/40 text-xs">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fraud section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="text-gold font-mono text-sm mb-3">// FRAUD RESILIENCE</div>
              <h2 className="text-4xl font-black text-white mb-6">Built to be<br /><span className="text-gradient">cheat-proof.</span></h2>
              <p className="text-white/60 leading-relaxed mb-8">
                Common manipulations like shelf-stuffing, location bias, and borrowed inventory
                are automatically flagged using cross-signal validation. Every signal has a counter-signal.
              </p>
              <div className="space-y-3">
                {['Multi-image consistency checks', 'Inventory-to-footfall cross-validation', 'GPS footprint vs visual area discrepancy', 'Temporal logic from short video clips'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-risk-low flex-shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 glass rounded-2xl p-6 border border-red-500/20 glow-red">
              <div className="text-red-400 font-mono text-xs mb-4 flex items-center gap-2">
                <Shield size={12} />
                FRAUD DETECTION ACTIVE
              </div>
              <div className="space-y-4">
                {[
                  { flag: 'SHELF_STUFFING', confidence: 87, status: 'DETECTED' },
                  { flag: 'INVENTORY_FOOTFALL_MISMATCH', confidence: 92, status: 'DETECTED' },
                  { flag: 'LOCATION_BIAS', confidence: 43, status: 'CLEAR' },
                ].map(f => (
                  <div key={f.flag} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                    <div>
                      <div className="text-xs font-mono text-white/60">{f.flag}</div>
                      <div className="text-xs text-white/30 mt-0.5">confidence: {f.confidence}%</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      f.status === 'DETECTED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-gold font-mono text-sm mb-4">// TRY IT NOW</div>
          <h2 className="text-5xl font-black text-white mb-6">
            Every kirana store<br />
            <span className="text-gradient">deserves a fair shot.</span>
          </h2>
          <p className="text-white/50 mb-10">Upload photos. Drop a pin. Get a decision.</p>
          <Link
            to="/assess"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gold hover:bg-gold-light text-navy font-black text-xl rounded-2xl transition-all hover:glow-gold hover:scale-105"
          >
            <Zap size={22} />
            Assess a Store Now
          </Link>
        </div>
      </section>
    </div>
  )
}
