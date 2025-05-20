import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initSupabaseFunctions } from './lib/supabase-functions'

// Initialize Supabase RPC functions
initSupabaseFunctions();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
