import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { roomsApi } from '../lib/api'
import { getUsername, saveUsername } from '../lib/userStore'

type JoinGamePageProps = {
  isDarkMode: boolean
}

export const JoinGamePage = ({ isDarkMode }: JoinGamePageProps) => {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadStoredName = async () => {
      const stored = await getUsername()
      if (stored) {
        setPlayerName(stored)
      }
    }
    void loadStoredName()
  }, [])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!playerName.trim() || !inviteCode) {
      setError('Име и invite код са задължителни')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const room = await roomsApi.getRoomByInviteCode(inviteCode)
      const result = await roomsApi.joinRoom(room.roomId, playerName.trim())

      await saveUsername(playerName.trim())

      localStorage.setItem('currentRoomId', result.room.roomId)
      localStorage.setItem('currentPlayerId', result.player.playerId)

      navigate(`/lobby/${result.room.roomId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при join')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={`min-h-dvh flex items-center justify-center px-4 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <form
        onSubmit={handleJoin}
        className={`w-full max-w-md rounded-xl border p-6 shadow-sm ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}
      >
        <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Присъединяване към игра
        </h1>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Invite код: <span className="font-mono font-semibold">{inviteCode}</span>
        </p>

        <label className={`mt-6 block text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} htmlFor="playerName">
          Твоето име
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className={`mt-2 w-full rounded-md border px-3 py-2 outline-none ${isDarkMode ? 'border-slate-600 bg-slate-900 text-slate-100 focus:border-slate-500' : 'border-slate-300 text-slate-900 focus:border-slate-400'}`}
          placeholder="Въведи име"
          autoComplete="off"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isLoading ? 'Присъединяване...' : 'Присъединяване'}
        </button>
      </form>
    </main>
  )
}
