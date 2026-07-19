import { ScanEye, Gauge, Users, FileText, ShieldCheck } from 'lucide-react'

const workflow = [
  { icon: ScanEye, title: 'Image analysis', text: 'Gemini 2.5 Flash performs scene understanding and returns strict, validated JSON — never free-form prose.' },
  { icon: Gauge, title: 'Risk scoring engine', text: 'A deterministic, hand-tuned weighting system converts detections into an explainable 0–100 score, independent of the LLM.' },
  { icon: Users, title: 'Response recommendation', text: 'Detected hazards route the case to the right team: fire brigade, flood rescue, EMS, or search & rescue.' },
  { icon: FileText, title: 'Incident report generator', text: 'Every analysis is saved as a structured incident with a downloadable PDF report.' },
]

export default function About() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow mb-3">About RescueLens AI</p>
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">
        AI-powered emergency image triage for faster disaster response.
      </h1>

      <div className="glass-card mb-10 p-6">
        <h2 className="mb-2 font-display text-lg font-semibold text-alert-red">The problem</h2>
        <p className="leading-relaxed text-paper/70">
          During a disaster, responders are flooded with images from WhatsApp, Twitter, NGO
          reports, and citizen uploads. Nobody can manually inspect every photo. Duplicates,
          low-priority reports, and genuine emergencies all arrive at once — and every minute
          spent sorting them is a minute not spent on rescue.
        </p>
      </div>

      <div className="glass-card mb-10 p-6">
        <h2 className="mb-2 font-display text-lg font-semibold text-scan-cyan">The solution</h2>
        <p className="leading-relaxed text-paper/70">
          A responder uploads a single image. RescueLens AI detects what's happening,
          calculates urgency with its own explainable scoring engine, suggests a response
          team, and generates a structured incident report — all within seconds.
        </p>
      </div>

      <h2 className="mb-5 font-display text-lg font-semibold">Pipeline</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {workflow.map((step) => (
          <div key={step.title} className="glass-card p-5">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-scan-cyan/10 text-scan-cyan">
              <step.icon size={18} />
            </span>
            <h3 className="mb-1 font-display font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-paper/60">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="glass-card mt-10 flex items-start gap-4 p-6">
        <ShieldCheck size={22} className="mt-1 shrink-0 text-emerald-400" />
        <p className="text-sm leading-relaxed text-paper/60">
          RescueLens AI is a decision-support tool, not an autonomous dispatcher. Every
          recommendation is meant to help a human responder prioritize faster — final
          decisions always rest with trained emergency personnel.
        </p>
      </div>
    </section>
  )
}
