import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Survey from './Survey.jsx'
import Report from './Report.jsx'

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {path === '/survey' ? <Survey /> : path === '/report' ? <Report /> : <App />}
  </StrictMode>,
)