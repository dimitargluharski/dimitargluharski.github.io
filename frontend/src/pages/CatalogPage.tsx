import { useState } from "react"
import { useNavigate } from "react-router"
import { Header } from "../components/Header"
import { roomsApi } from "../lib/api"
import { getUsername } from "../lib/userStore"

type CatalogPageProps = {
  isDarkMode: boolean
}

export const CatalogPage = ({ isDarkMode }: CatalogPageProps) => {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreateRoom = async (gameKey: string) => {
    setIsCreating(true)
    setError('')

    try {
      const username = await getUsername()
      const response = await roomsApi.createRoom(gameKey, username || undefined)

      localStorage.setItem('currentRoomId', response.roomId)
      localStorage.setItem('currentPlayerId', response.room.players[0]?.playerId || '')

      navigate(`/lobby/${response.roomId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при създаване на стая')
    } finally {
      setIsCreating(false)
    }
  }

  const games = [
    { key: 'codenames', name: 'Codenames', description: '' }
  ]

  return (
    <div className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}>
      <Header isDarkMode={isDarkMode} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Игри
        </h1>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Избери игра и създай нова стая, или се присъедини към приятел с invite код
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map(game => (
            <div
              key={game.key}
              className={`rounded-lg border p-6 ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-750' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <h3 className="text-lg font-semibold">{game.name}</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {game.description}
              </p>
              <button
                onClick={() => handleCreateRoom(game.key)}
                disabled={isCreating}
                className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isCreating ? 'Създаване...' : 'Създай стая'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}