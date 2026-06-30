import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

// Spotify OAuth callback handler - side-effect
// Popup'tan dönen code parametresini yakalar ve parent pencereye iletir
import './lib/spotifyAuth'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
