import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-400" />,
  error: <AlertTriangle size={18} className="text-alert-red" />,
  info: <Info size={18} className="text-scan-cyan" />,
}

export default function Toast({ toast }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="glass-card flex items-center gap-3 px-5 py-3"
          >
            {ICONS[toast.type] || ICONS.info}
            <span className="text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
