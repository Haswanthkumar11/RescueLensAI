import { motion } from 'framer-motion'
import { priorityStyles } from '../utils/priority'

export default function RiskMeter({ score = 0, priority = 'Medium' }) {
  const styles = priorityStyles(priority)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="glass-card flex flex-col items-center gap-4 p-6">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1E293B" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={styles.text}
            stroke="currentColor"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold">{score}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
            / 100
          </span>
        </div>
      </div>
      <span className={`rounded-full px-4 py-1.5 font-mono text-sm font-semibold uppercase tracking-wide ring-1 ${styles.text} ${styles.ring}`}>
        {priority} priority
      </span>
    </div>
  )
}
