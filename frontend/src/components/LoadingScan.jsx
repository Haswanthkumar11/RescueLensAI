import { motion } from 'framer-motion'

const steps = [
  'Uploading image to secure storage',
  'Running Gemini Vision scene analysis',
  'Scoring urgency with the risk engine',
  'Compiling incident report',
]

export default function LoadingScan({ activeStep = 0 }) {
  return (
    <div className="glass-card mx-auto max-w-md p-8 text-center">
      <div className="relative mx-auto mb-8 h-48 w-48 overflow-hidden rounded-xl border border-navy-border bg-navy">
        <div className="absolute inset-0 bg-grid-fade bg-[size:16px_16px]" />
        <div className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-scan-cyan/25 to-transparent animate-scanline" />
      </div>
      <p className="eyebrow mb-4">Analyzing scene</p>
      <ul className="space-y-3 text-left">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                i <= activeStep ? 'bg-scan-cyan' : 'bg-navy-border'
              }`}
            />
            <span className={`text-sm ${i <= activeStep ? 'text-paper' : 'text-paper/40'}`}>
              {step}
            </span>
          </li>
        ))}
      </ul>
      <motion.div
        className="mt-6 h-1 w-full overflow-hidden rounded-full bg-navy-border"
      >
        <motion.div
          className="h-full bg-scan-cyan"
          initial={{ width: '0%' }}
          animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </div>
  )
}
