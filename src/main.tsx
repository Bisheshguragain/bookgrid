import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Clear potentially corrupted auth storage on startup
try {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    // If the stored data has complex user/profile objects, clear it
    if (parsed?.state?.user || parsed?.state?.profile) {
      localStorage.removeItem('auth-storage');
    }
  }
} catch {
  // If JSON parse fails, the data is corrupted - clear it
  localStorage.removeItem('auth-storage');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
