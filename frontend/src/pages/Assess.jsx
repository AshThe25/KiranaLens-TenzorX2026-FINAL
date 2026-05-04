import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Upload, MapPin, X, Image, Loader2, AlertCircle, ChevronRight } from 'lucide-react'

const SAMPLE_LOCATIONS = [
  { name: 'Dharavi, Mumbai', lat: 19.0432, lng: 72.8540 },
  { name: 'Karol Bagh, Delhi', lat: 28.6519, lng: 77.1909 },
  { name: 'Rajajinagar, Bengaluru', lat: 12.9915, lng: 77.5560 },
  { name: 'Ghatkopar, Mumbai', lat: 19.0860, lng: 72.9081 },
]

export default function Assess() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [location, setLocation] = useState({ lat: '', lng: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  const [analysisStage, setAnalysisStage] = useState('')

  const onDrop = useCallback(accepted => {
    const newFiles = accepted.slice(0, 5 - images.length).map(f => ({
      file: f,
      preview: URL.createObjectURL(f)
    }))
    setImages(prev => [...prev, ...newFiles].slice(0, 5))
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    disabled: images.length >= 5
  })

  const removeImage = idx => setImages(prev => prev.filter((_, i) => i !== idx))

  const useDemo = () => {
    setLocation(SAMPLE_LOCATIONS[0])
  }

  const handleSubmit = async () => {
    if (images.length < 1) return setError('Upload at least 1 store photo')
    if (!location.lat || !location.lng) return setError('Select a location')
    setError(null)
    setLoading(true)

    const stages = [
      'Uploading images…',
      'Running Vision AI — detecting shelves & products…',
      'Computing Shelf Density Index…',
      'Scoring SKU Diversity…',
      'Fetching geo-spatial signals…',
      'Checking fraud indicators…',
      'Calibrating confidence bands…',
      'Generating credit decision…',
    ]

    let i = 0
    const interval = setInterval(() => {
      setAnalysisStage(stages[i % stages.length])
      i++
    }, 900)

    try {
      const form = new FormData()
      images.forEach(({ file }) => form.append('images', file))
      form.append('lat', location.lat)
      form.append('lng', location.lng)
      form.append('location_name', location.name || 'Unknown Location')

      const { data } = await axios.post('/api/assess', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      clearInterval(interval)
      navigate(`/dashboard/${data.assessment_id}`, { state: { result: data } })
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.error || 'Assessment failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="text-gold font-mono text-sm mb-2">// NEW ASSESSMENT</div>
          <h1 className="text-4xl font-black text-white mb-2">Assess a Kirana Store</h1>
          <p className="text-white/50">Upload 3–5 store photos + pin a location. AI does the rest.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step >= s ? 'bg-gold text-navy' : 'bg-white/10 text-white/40'
              }`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-white/30'}`}>
                {s === 1 ? 'Upload Photos' : 'Set Location'}
              </span>
              {s < 2 && <ChevronRight size={16} className="text-white/20" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Image size={16} className="text-gold" />
                Store Photos
                <span className="text-white/30 text-sm font-normal">({images.length}/5)</span>
              </h2>
              <span className="text-white/30 text-xs">Min: 1, Recommended: 3–5</span>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-gold bg-gold/5 glow-gold'
                  : images.length >= 5
                  ? 'border-white/5 bg-white/2 cursor-not-allowed'
                  : 'border-white/15 hover:border-gold/40 hover:bg-white/3'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={28} className={`mx-auto mb-3 ${isDragActive ? 'text-gold' : 'text-white/30'}`} />
              <p className="text-white/60 text-sm">
                {isDragActive
                  ? 'Drop the images here'
                  : images.length >= 5
                  ? '5 images uploaded (max reached)'
                  : 'Drag & drop store photos here, or click to select'}
              </p>
              <p className="text-white/30 text-xs mt-1">Supports JPG, PNG, WEBP</p>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeImage(idx)}
                        className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 text-xs font-mono bg-navy/80 text-gold px-1.5 py-0.5 rounded">
                      {['Shelves', 'Counter', 'Exterior', 'Interior', 'Stock'][idx]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-white/40 text-xs leading-relaxed">
                <span className="text-gold font-semibold">Pro tip:</span> Upload photos of shelves, counter, exterior, and stock room for highest accuracy. Multiple angles improve confidence score.
              </p>
            </div>
          </div>

          {/* Right: Location */}
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-gold" />
              Store Location
            </h2>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-white/50 text-xs font-mono mb-1 block">LOCATION NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Dharavi, Mumbai"
                  value={location.name}
                  onChange={e => setLocation(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs font-mono mb-1 block">LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="19.0432"
                    value={location.lat}
                    onChange={e => setLocation(p => ({ ...p, lat: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs font-mono mb-1 block">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="72.8540"
                    value={location.lng}
                    onChange={e => setLocation(p => ({ ...p, lng: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Quick locations */}
            <div className="mb-6">
              <p className="text-white/30 text-xs font-mono mb-2">// DEMO LOCATIONS</p>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_LOCATIONS.map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => setLocation(loc)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs border transition-all ${
                      location.name === loc.name
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    <MapPin size={10} className="inline mr-1 mb-0.5" />
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="p-4 rounded-xl border border-white/8 bg-white/3 space-y-2 mb-6">
              <p className="text-white/40 text-xs font-mono">// GEO SIGNALS COMPUTED</p>
              {['Catchment Population Density', 'Footfall Proxy Index', 'Competition Store Count', 'Road Type Classification', 'POI Proximity Score'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/60 flex-shrink-0" />
                  <span className="text-white/50 text-xs">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye size={20} className="text-gold" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Analyzing Store…</p>
                <p className="text-gold font-mono text-sm animate-pulse">{analysisStage}</p>
              </div>
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={images.length === 0 || !location.lat}
              className="flex items-center gap-3 px-12 py-5 bg-gold hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed text-navy font-black text-lg rounded-2xl transition-all hover:glow-gold hover:scale-105 disabled:hover:scale-100 disabled:hover:glow-none"
            >
              <Zap size={20} />
              Run Assessment
            </button>
          )}
          <p className="text-white/20 text-xs mt-4">Average processing time: 4–8 seconds</p>
        </div>
      </div>
    </div>
  )
}
