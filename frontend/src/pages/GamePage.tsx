import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { roomsApi, type RoomDetailsDto } from '../lib/api'

type GamePageProps = {
  isDarkMode: boolean
}

export const GamePage = ({ isDarkMode }: GamePageProps) => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<RoomDetailsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const playerId = localStorage.getItem('currentPlayerId') || ''

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return

      try {
        const roomData = await roomsApi.getRoomById(roomId)
        setRoom(roomData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Грешка при заредване')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoom()
  }, [roomId])

  if (isLoading) {
    return (
      <div className={`min-h-dvh flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <p className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>Зарежда се...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className={`min-h-dvh flex items-center justify-center px-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <div className={`max-w-md rounded-lg border p-6 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {error || 'Няма стая'}
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Начало
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className={`min-h-dvh px-4 py-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <div className={`mx-auto max-w-2xl rounded-lg border p-6 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              🎮 Игра е стартирана
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Игра: <span className="font-semibold">{room.gameKey}</span>
            </p>
          </div>
          <button
            onClick={() => navigate(`/lobby/${roomId}`)}
            className={`rounded-md border px-3 py-1 text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 text-slate-900 hover:bg-slate-50'}`}
          >
            Назад
          </button>
        </div>

        <div className={`mt-8 rounded-lg border p-6 ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
          <p className={`text-center text-lg ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            ⏳ Играта се подготвя...
          </p>
          <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Логиката на играта скоро ще бъде имплементирана.
          </p>
        </div>

        <div className="mt-8">
          <h2 className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Играчи ({room.players.length})
          </h2>
          <div className={`flex flex-wrap gap-2 rounded border p-3 ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
            {room.players.map(player => (
              <span
                key={player.playerId}
                className={`rounded-full px-3 py-1 text-sm font-medium ${player.playerId === playerId
                  ? 'bg-green-600 text-white'
                  : isDarkMode
                    ? 'bg-slate-600 text-slate-100'
                    : 'bg-slate-200 text-slate-900'
                  }`}
              >
                {player.name} {player.playerId === playerId ? '(ти)' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
