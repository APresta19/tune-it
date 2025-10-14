import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AddSong from './components/AddSong'
import './index.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<AddSong />} />

        {/* fallback route */}
        <Route path="*" element={<AddSong />} />
      </Routes>
    </Router>
  </StrictMode>
)
