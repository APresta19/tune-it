import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AddSong from './components/AddSong'
import Playback from './components/Playback'
import CreateGame from './components/CreateGame'
import JoinGame from './components/JoinGame'
import Landing from './components/Landing'
import Lobby from './components/Lobby'
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
        <Route path="/" element={<Landing />} />
        <Route path="/add-song" element={<AddSong />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Router>
  );
}
export default App;