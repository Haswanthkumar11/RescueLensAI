import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0f172a]/80 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-2 text-[#DC2626]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626] animate-ping" />
            <p className="font-mono text-xs uppercase tracking-wider font-semibold">System Configuration Warning</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Missing Supabase Variables</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The frontend has been built without the required Supabase environment keys. To run the RescueLens AI platform, please define the following environment variables in your Vercel Project Settings:
          </p>
          <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px] text-[#2DD4BF]">
            <div>VITE_SUPABASE_URL</div>
            <div>VITE_SUPABASE_ANON_KEY</div>
            <div>VITE_API_URL <span className="text-slate-500">(FastAPI Render Endpoint)</span></div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            After configuring these variables, trigger a new deployment in Vercel to rebuild with active credentials.
          </p>
        </div>
      </div>
    </React.StrictMode>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
}
