import { Route, Routes } from "react-router"
import { CatalogPage } from "./pages/CatalogPage"
import { LoginPage } from "./pages/LoginPage"
import { JoinGamePage } from "./pages/JoinGamePage"
import { LobbyPage } from "./pages/LobbyPage"
import { GamePage } from "./pages/GamePage"
import { useSystemTheme } from "./hooks/useSystemTheme"

function App() {
  const theme = useSystemTheme()
  const isDarkMode = theme === 'dark'

  return (
    <div className={`min-h-dvh ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <Routes>
        <Route path="/" element={<LoginPage isDarkMode={isDarkMode} />} />
        <Route path="/catalog" element={<CatalogPage isDarkMode={isDarkMode} />} />
        <Route path="/join/:inviteCode" element={<JoinGamePage isDarkMode={isDarkMode} />} />
        <Route path="/lobby/:roomId" element={<LobbyPage isDarkMode={isDarkMode} />} />
        <Route path="/game/:roomId" element={<GamePage isDarkMode={isDarkMode} />} />
      </Routes>
    </div>
  )
}

export default App
