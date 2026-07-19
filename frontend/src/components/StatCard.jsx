export default function StatCard({ label, value, accent = 'text-scan-cyan' }) {
  return (
    <div className="glass-card p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}
