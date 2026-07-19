import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, LayoutDashboard } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-navy-border">
      <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,black,transparent)]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="eyebrow mb-5">Emergency image triage, in seconds</p>
          <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
            Every second an image
            <br />
            sits unread <span className="text-alert-red">costs a life.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-paper/70 sm:text-lg">
            Responders are flooded with photos from WhatsApp, Twitter, and citizen
            uploads during a disaster. RescueLens AI reads every image, scores its
            urgency, and routes it to the right team — before a human has to look twice.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/upload" className="btn-primary">
              Analyze Image <ArrowRight size={18} />
            </Link>
            <Link to="/history" className="btn-secondary">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          {/* Signature element: radar / thermal-scan rings, echoing the
              rescue-tech "night vision sweeping a scene" motif */}
          <div className="glass-card relative flex h-full w-full items-center justify-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-scan-cyan/20 to-transparent animate-scanline" />
            </div>
            {[1, 2, 3].map((ring) => (
              <span
                key={ring}
                className="absolute rounded-full border border-scan-cyan/25"
                style={{ width: `${ring * 32}%`, height: `${ring * 32}%` }}
              />
            ))}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-alert-red/20 ring-2 ring-alert-red/50">
              <span className="h-3 w-3 rounded-full bg-alert-red animate-pulseGlow" />
            </div>
            <span className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-widest text-scan-cyan/70">
              Scene detected · 92% confidence
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
