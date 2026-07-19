import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadCard from '../components/UploadCard'
import LoadingScan from '../components/LoadingScan'
import { analyzeImage } from '../services/api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleAnalyze = async () => {
    if (!file) return
    setError(null)
    setIsAnalyzing(true)
    setStep(0)

    // Advance the loading UI steps while the single /analyze request runs.
    const ticker = setInterval(() => {
      setStep((s) => Math.min(s + 1, 3))
    }, 900)

    try {
      const result = await analyzeImage(file)
      clearInterval(ticker)
      setStep(3)
      setTimeout(() => navigate(`/result/${result.incident_id}`, { state: result }), 400)
    } catch (err) {
      clearInterval(ticker)
      setIsAnalyzing(false)
      setError(
        err?.response?.data?.detail ||
          'Analysis failed. Check that the backend and GEMINI_API_KEY are configured.',
      )
    }
  }

  if (isAnalyzing) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-20">
        <LoadingScan activeStep={step} />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <p className="eyebrow mb-3">Step 1 of 2</p>
      <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Upload an emergency image</h1>
      <p className="mb-8 text-paper/60">
        We'll analyze hazards, estimate urgency, and suggest a response team.
      </p>

      <UploadCard onFileSelected={setFile} />

      {error && (
        <p className="mt-4 rounded-xl border border-alert-red/30 bg-alert-red/10 px-4 py-3 text-sm text-alert-red">
          {error}
        </p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        Analyze Image
      </button>
    </section>
  )
}
