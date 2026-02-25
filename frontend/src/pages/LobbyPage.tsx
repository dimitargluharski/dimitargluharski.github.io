import { useEffect, useRef, useState } from 'react'
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
  const shouldLeaveLobbyRef = useRef(true)
  const [room, setRoom] = useState<RoomDetailsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false)
  const [isRandomizing, setIsRandomizing] = useState(false)
  const [error, setError] = useState('')
  const { joinLobby, leaveLobby, startGame, updatePlayerAssignment, randomizeAssignments, roomData, startedRoomId, isConnected } = useSignalRLobby()

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Грешка при заредване')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoom()

    return () => {
      if (shouldLeaveLobbyRef.current && playerId && roomId) {
        void leaveLobby(roomId, playerId)
      }
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId || !playerId || !isConnected) return
    void joinLobby(roomId, playerId)
  }, [roomId, playerId, isConnected])

  // Update room data from SignalR events
  useEffect(() => {
    if (roomData) {
      setRoom(roomData)
    }
  }, [roomData])

  useEffect(() => {
    if (roomId && startedRoomId === roomId) {
      shouldLeaveLobbyRef.current = false
      navigate(`/game/${roomId}`)
    }
  }, [startedRoomId, roomId, navigate])

  useEffect(() => {
    if (!roomId) {
      return
    }

    let isDisposed = false

    const checkIfGameStarted = async () => {
      try {
        const status = await roomsApi.getCodenamesGameStatus(roomId)
        if (!isDisposed && status.started) {
          shouldLeaveLobbyRef.current = false
          navigate(`/game/${roomId}`)
        }
      } catch {
        // Temporary network error. Keep user in lobby.
      }
    }

    const intervalId = window.setInterval(() => {
      void checkIfGameStarted()
    }, 2500)

    void checkIfGameStarted()

    return () => {
      isDisposed = true
      window.clearInterval(intervalId)
    }
  }, [roomId, navigate])

  const handleStartGame = async () => {
    if (roomId) {
      try {
        await roomsApi.startCodenamesGame(roomId)
        await startGame(roomId)
        shouldLeaveLobbyRef.current = false
        navigate(`/game/${roomId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неуспешен старт на играта')
      }
    }
  }

  const handleRolePick = async (team: 'Red' | 'Blue', role: 'Operative' | 'Spymaster' | 'Tester') => {
    if (!roomId || !playerId) return

    setIsUpdatingAssignment(true)
    setError('')

    try {
      await updatePlayerAssignment(roomId, playerId, team, role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешна промяна на роля/отбор')
    } finally {
      setIsUpdatingAssignment(false)
    }
  }

  const handleRandomizeTeams = async () => {
    if (!roomId) return

    setIsRandomizing(true)
    setError('')

    try {
      await randomizeAssignments(roomId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно разбъркване на отборите')
    } finally {
      setIsRandomizing(false)
    }
  }

  const getTeamTextClass = (team: 'Red' | 'Blue') => team === 'Red' ? 'text-red-500' : 'text-blue-500'
  const getRoleBadgeClass = (role: 'Operative' | 'Spymaster' | 'Tester') => {
    if (role === 'Spymaster') return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    if (role === 'Tester') return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
  const roleLabel = (role: 'Operative' | 'Spymaster' | 'Tester') => {
    if (role === 'Spymaster') return 'Координатор'
    if (role === 'Tester') return 'Tester'
    return 'Полеви агент'
  }
  const redTeamPlayers = room?.players.filter(player => player.team === 'Red') ?? []
  const blueTeamPlayers = room?.players.filter(player => player.team === 'Blue') ?? []

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
      <div className={`mx-auto max-w-4xl rounded-lg border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Лоби:
            </h1>
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

        <div className={`mt-4 rounded-md border p-3 ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Избери роля с 1 клик
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isHost && (
              <button
                onClick={handleRandomizeTeams}
                disabled={isRandomizing}
                className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
              >
                {isRandomizing ? 'Разбъркване...' : '🎲 Randomize teams'}
              </button>
            )}
            {currentPlayer && localStorage.getItem('showTesterMode') === 'true' && (
              <button
                onClick={() => void handleRolePick(currentPlayer.team, 'Tester')}
                disabled={isUpdatingAssignment}
                className="rounded-md bg-fuchsia-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                🛠 Шано: пусни Tester
              </button>
            )}
            <span className="text-xs text-green-500">{currentPlayer ? `Ти: ${currentPlayer.team} / ${currentPlayer.role}` : 'Готово'}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className={`rounded-md border p-3 ${isDarkMode ? 'border-red-900 bg-red-950/20' : 'border-red-200 bg-red-50'}`}>
            <h2 className="text-sm font-semibold text-red-500">🔴 Червени ({redTeamPlayers.length})</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void handleRolePick('Red', 'Spymaster')}
                disabled={isUpdatingAssignment}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                + Координатор
              </button>
              <button
                onClick={() => void handleRolePick('Red', 'Operative')}
                disabled={isUpdatingAssignment}
                className="rounded-md bg-red-500/80 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                + Полеви агент
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {redTeamPlayers.map(player => (
                <div key={player.playerId} className={`rounded-md border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                  <p className={`text-sm font-semibold ${getTeamTextClass(player.team)}`}>
                    {player.name}
                    {player.isHost ? ' (Хост)' : ''}
                    {player.playerId === playerId ? ' • Ти' : ''}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(player.role)}`}>
                      {roleLabel(player.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-md border p-3 ${isDarkMode ? 'border-blue-900 bg-blue-950/20' : 'border-blue-200 bg-blue-50'}`}>
            <h2 className="text-sm font-semibold text-blue-500">🔵 Сини ({blueTeamPlayers.length})</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void handleRolePick('Blue', 'Spymaster')}
                disabled={isUpdatingAssignment}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                + Координатор
              </button>
              <button
                onClick={() => void handleRolePick('Blue', 'Operative')}
                disabled={isUpdatingAssignment}
                className="rounded-md bg-blue-500/80 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                + Полеви агент
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {blueTeamPlayers.map(player => (
                <div key={player.playerId} className={`rounded-md border px-3 py-2 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                  <p className={`text-sm font-semibold ${getTeamTextClass(player.team)}`}>
                    {player.name}
                    {player.isHost ? ' (Хост)' : ''}
                    {player.playerId === playerId ? ' • Ти' : ''}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(player.role)}`}>
                      {roleLabel(player.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        <div className="mt-4 flex gap-3">
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
