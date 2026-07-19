export default function Footer() {
  return (
    <footer className="border-t border-navy-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-paper/50 sm:flex-row">
        <p>RescueLens AI — built for disaster-response hackathons.</p>
        <p className="font-mono text-xs">Gemini 3.5 Flash · FastAPI · Supabase</p>
      </div>
    </footer>
  )
}
