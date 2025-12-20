import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AddSong from './components/AddSong'
import Playback from './components/Playback'
import './index.css'

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");

    if (token) {
      // Add token to local storage
      localStorage.setItem("access_token", token);

      // Remove token from query parameter
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AddSong />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="*" element={<AddSong />} />
      </Routes>
    </Router>
  );
}
export default App;