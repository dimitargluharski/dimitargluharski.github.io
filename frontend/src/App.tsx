import { Route, Routes } from "react-router"
import { CatalogPage } from "./pages/CatalogPage"
import { LoginPage } from "./pages/LoginPage"
import { useSystemTheme } from "./hooks/useSystemTheme"

function App() {
  const theme = useSystemTheme()
  const isDarkMode = theme === 'dark'

  return (
    <div className={`min-h-dvh ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <Routes>
        <Route path="/" element={<LoginPage isDarkMode={isDarkMode} />} />
        <Route path="/catalog" element={<CatalogPage isDarkMode={isDarkMode} />} />
      </Routes>
    </div>
  )
}

export default App
