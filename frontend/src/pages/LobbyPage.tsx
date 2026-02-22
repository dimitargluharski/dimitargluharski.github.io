import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import Swal from 'sweetalert2'
import { useSignalRLobby } from '../hooks/useSignalRLobby'
import { roomsApi, type RoomDetailsDto } from '../lib/api'

type LobbyPageProps = {
  isDarkMode: boolean
}

export const LobbyPage = ({ isDarkMode }: LobbyPageProps) => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<RoomDetailsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { joinLobby, leaveLobby, startGame, roomData } = useSignalRLobby()

  const playerId = localStorage.getItem('currentPlayerId') || ''
  const currentPlayer = room?.players.find(p => p.playerId === playerId)
  const isHost = currentPlayer?.isHost

  const copyInviteCode = async () => {
    if (room?.inviteCode) {
      const inviteUrl = `${window.location.origin}/join/${room.inviteCode}`
      await navigator.clipboard.writeText(inviteUrl)

      await Swal.fire({
        title: '✓ Копирано!',
        html: `<code style="font-size: 12px; word-break: break-all;">${inviteUrl}</code>`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#1e293b'
      })
    }
  }

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return

      try {
        const roomData = await roomsApi.getRoomById(roomId)
        setRoom(roomData)

        if (playerId) {
          await joinLobby(roomId, playerId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Грешка при заредване')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoom()

    return () => {
      if (playerId && roomId) {
        void leaveLobby(roomId, playerId)
      }
    }
  }, [roomId, playerId])

  // Update room data from SignalR events
  useEffect(() => {
    if (roomData) {
      setRoom(roomData)
    }
  }, [roomData])

  const handleStartGame = async () => {
    if (roomId) {
      await startGame(roomId)
      navigate(`/game/${roomId}`)
    }
  }

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Лобибю
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Игра: <span className="font-semibold">{room.gameKey}</span>
            </p>
          </div>
          <div>
            <button
              onClick={copyInviteCode}
              title={`Копирай: ${room.inviteCode}`}
              className={`rounded-full p-2 transition ${isDarkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
            >
              🔗
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Играчи ({room.players.length})
          </h2>
          <div className="mt-4 space-y-3">
            {room.players.map(player => (
              <div
                key={player.playerId}
                className={`flex items-center justify-between rounded-md border p-3 ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}
              >
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {player.name}
                    {player.isHost && <span className="ml-2 text-xs font-semibold text-blue-600">(Хост)</span>}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Присъедини се в {new Date(player.joinedAtUtc).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`text-sm font-semibold ${player.playerId === playerId ? 'text-green-600' : isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  {player.playerId === playerId ? '✓ Ти' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 text-slate-900 hover:bg-slate-50'}`}
          >
            Назад
          </button>
          {isHost && (
            <button
              onClick={handleStartGame}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Начало на игра
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
