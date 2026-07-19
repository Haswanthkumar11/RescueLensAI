import Hero from '../components/Hero'
import { Link } from 'react-router-dom'
import { ScanEye, Gauge, Users, FileText } from 'lucide-react'

const steps = [
  { icon: ScanEye, title: 'Scene understanding', text: 'Gemini Vision reads the image and extracts hazards, people, and conditions into structured JSON.' },
  { icon: Gauge, title: 'Risk scoring', text: 'A deterministic, explainable engine turns detections into a 0–100 urgency score.' },
  { icon: Users, title: 'Team routing', text: 'The right responder — fire, flood rescue, EMS, or search & rescue — is suggested automatically.' },
  { icon: FileText, title: 'Incident report', text: 'A structured report is generated and saved, ready to export as PDF.' },
]

export default function Landing() {
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="mb-12 max-w-xl text-3xl font-bold sm:text-4xl">
          From raw photo to routed response, in one pipeline.
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="glass-card p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-scan-cyan/10 font-mono text-scan-cyan">
                <step.icon size={20} />
              </span>
              <h3 className="mb-2 font-display font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-paper/60">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-navy-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Responders shouldn't have to open every image.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-paper/60">
            Try it with a sample disaster photo and see the full triage pipeline run in seconds.
          </p>
          <Link to="/upload" className="btn-primary mx-auto w-fit">
            Analyze an Image
          </Link>
        </div>
      </section>
    </>
  )
}
