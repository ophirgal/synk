import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'webrtc-adapter'; // a shim to insulate apps from WebRTC incompatibilities 
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
