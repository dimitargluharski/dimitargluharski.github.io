import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { roomsApi, type CodenamesCardDto, type CodenamesGameDto, type RoomDetailsDto } from '../lib/api'
import { useSignalRLobby } from '../hooks/useSignalRLobby'

type GamePageProps = {
  isDarkMode: boolean
}

const normalizeRole = (value: unknown): 'Operative' | 'Spymaster' | 'Tester' | null => {
  if (value === 'Operative' || value === 'Spymaster' || value === 'Tester') return value
  if (typeof value === 'number') {
    if (value === 0) return 'Operative'
    if (value === 1) return 'Spymaster'
    if (value === 2) return 'Tester'
  }
  return null
}

const normalizeTeam = (value: unknown): 'Red' | 'Blue' | null => {
  if (value === 'Red' || value === 'Blue') return value
  if (typeof value === 'number') {
    if (value === 0) return 'Red'
    if (value === 1) return 'Blue'
  }
  return null
}

const normalizeGamePhase = (value: unknown): 'SpymasterClue' | 'TeamGuessing' | 'GameOver' | null => {
  if (value === 'SpymasterClue' || value === 'TeamGuessing' || value === 'GameOver') return value
  if (typeof value === 'number') {
    if (value === 0) return 'SpymasterClue'
    if (value === 1) return 'TeamGuessing'
    if (value === 2) return 'GameOver'
  }
  return null
}

const normalizeCardTeam = (value: unknown): 'Red' | 'Blue' | 'Neutral' | 'Assassin' | null => {
  if (value === 'Red' || value === 'Blue' || value === 'Neutral' || value === 'Assassin') return value
  if (typeof value === 'number') {
    if (value === 0) return 'Red'
    if (value === 1) return 'Blue'
    if (value === 2) return 'Neutral'
    if (value === 3) return 'Assassin'
  }
  return null
}

type GuessResult = 'InvalidPhase' | 'NotFound' | 'AlreadyRevealed' | 'CorrectTeam' | 'CorrectTeamTurnEnds' | 'Neutral' | 'EnemyTeam' | 'Assassin' | 'Unknown'

type ClueHistoryItem = {
  id: string
  team: 'Red' | 'Blue'
  clue: string
  number: number
  total: number
  remaining: number
}

const normalizeGuessResult = (value: unknown): GuessResult => {
  if (
    value === 'InvalidPhase'
    || value === 'NotFound'
    || value === 'AlreadyRevealed'
    || value === 'CorrectTeam'
    || value === 'CorrectTeamTurnEnds'
    || value === 'Neutral'
    || value === 'EnemyTeam'
    || value === 'Assassin'
    || value === 'Unknown'
  ) {
    return value
  }

  if (typeof value === 'number') {
    if (value === 0) return 'InvalidPhase'
    if (value === 1) return 'NotFound'
    if (value === 2) return 'AlreadyRevealed'
    if (value === 3) return 'CorrectTeam'
    if (value === 4) return 'CorrectTeamTurnEnds'
    if (value === 5) return 'Neutral'
    if (value === 6) return 'EnemyTeam'
    if (value === 7) return 'Assassin'
    return 'Unknown'
  }

  return 'Unknown'
}

export const GamePage = ({ isDarkMode }: GamePageProps) => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<RoomDetailsDto | null>(null)
  const [game, setGame] = useState<CodenamesGameDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [clue, setClue] = useState('')
  const [clueNumber, setClueNumber] = useState('1')
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [guessFeedback, setGuessFeedback] = useState<{ text: string; tone: 'good' | 'bad' | 'neutral' } | null>(null)
  const [clueHistory, setClueHistory] = useState<ClueHistoryItem[]>([])
  const [showGuessPhasePopup, setShowGuessPhasePopup] = useState(false)
  const [endGameModal, setEndGameModal] = useState<{ winnerLabel: string; reason: string } | null>(null)
  const [turnJustEnded, setTurnJustEnded] = useState(false)
  const [correctGuessesInTurn, setCorrectGuessesInTurn] = useState(0)
  const clueInputRef = useRef<HTMLInputElement | null>(null)
  const clueNumberInputRef = useRef<HTMLInputElement | null>(null)
  const gameResultModalKeyRef = useRef<string | null>(null)
  const activeHistoryKeyRef = useRef<string | null>(null)
  const lastGameCreatedAtRef = useRef<string | null>(null)
  const { joinLobby, leaveLobby, roomData, hoverPointers, updateWordHover, isConnected } = useSignalRLobby()

  const playerId = localStorage.getItem('currentPlayerId') || ''
  const rawTesterMode = (localStorage.getItem('debugTesterMode') ?? '').trim()
  const normalizedTesterMode = rawTesterMode.replace(/^['"]|['"]$/g, '').toLowerCase()
  const isTesterDebugEnabled = normalizedTesterMode === 'true' || normalizedTesterMode === '1' || normalizedTesterMode === 'yes' || normalizedTesterMode === 'on'
  const currentPlayer = room?.players.find((player) => player.playerId === playerId)
  const activePlayer = currentPlayer ?? (isTesterDebugEnabled && room?.players.length === 1 ? room.players[0] : null)
  const activeRole = normalizeRole(activePlayer?.role)
  const activeTeam = normalizeTeam(activePlayer?.team)
  const currentGameTeam = normalizeTeam(game?.currentTeam)
  const currentPhase = normalizeGamePhase(game?.phase)
  const isTester = activeRole === 'Tester' || isTesterDebugEnabled
  const isCurrentPlayerTeamTurn = !!activeTeam && !!currentGameTeam && activeTeam === currentGameTeam
  const showTesterMode = localStorage.getItem('showTesterMode') === 'true'
  const shouldRevealKey = showTesterMode || isTester || activeRole === 'Spymaster'

  useEffect(() => {
    const loadRoom = async () => {
      if (!roomId) return

      try {
        const roomData = await roomsApi.getRoomById(roomId)
        const me = roomData.players.find((player) => player.playerId === playerId)
          ?? (isTesterDebugEnabled && roomData.players.length === 1 ? roomData.players[0] : undefined)
        let gameData = await roomsApi.getCodenamesGame(roomId, false)

        const showTesterModeOnLoad = localStorage.getItem('showTesterMode') === 'true'
        const canSeeKeyOnFirstLoad = showTesterModeOnLoad || (!!me && (
          normalizeRole(me.role) === 'Spymaster'
          || normalizeRole(me.role) === 'Tester'
          || isTesterDebugEnabled
        ))

        if (canSeeKeyOnFirstLoad) {
          gameData = await roomsApi.getCodenamesGame(roomId, true)
        }

        setRoom(roomData)
        setGame(gameData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Грешка при заредване')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRoom()
  }, [roomId, playerId])

  useEffect(() => {
    const refreshGameWithRoleVisibility = async () => {
      if (!roomId || !activePlayer) return

      try {
        const latestGame = await roomsApi.getCodenamesGame(roomId, shouldRevealKey)
        console.log('🔄 Auto-refresh triggered. Team:', latestGame.currentTeam)
        setGame(latestGame)
      } catch {
        // keep current local game state on transient refresh issues
      }
    }

    void refreshGameWithRoleVisibility()
  }, [roomId, activePlayer?.role, activePlayer?.team, isTesterDebugEnabled, shouldRevealKey, showTesterMode])

  useEffect(() => {
    if (!roomId) {
      return
    }

    let isDisposed = false

    const syncGameState = async () => {
      try {
        const [latestRoom, latestGame] = await Promise.all([
          roomsApi.getRoomById(roomId),
          roomsApi.getCodenamesGame(roomId, shouldRevealKey)
        ])

        if (isDisposed) {
          return
        }

        setRoom(latestRoom)
        setGame(latestGame)
      } catch {
        // Keep last good snapshot during transient network issues.
      }
    }

    const intervalId = window.setInterval(() => {
      void syncGameState()
    }, 1000)

    void syncGameState()

    return () => {
      isDisposed = true
      window.clearInterval(intervalId)
    }
  }, [roomId, shouldRevealKey])

  useEffect(() => {
    setHoveredWord(null)
    setGuessFeedback(null)
    setCorrectGuessesInTurn(0)
  }, [game?.currentTeam, game?.phase])

  useEffect(() => {
    if (roomData) {
      setRoom(roomData)
    }
  }, [roomData])

  useEffect(() => {
    if (!roomId || !playerId || !isConnected) return
    void joinLobby(roomId, playerId)

    return () => {
      void updateWordHover(roomId, playerId, null)
      void leaveLobby(roomId, playerId)
    }
  }, [roomId, playerId, isConnected])

  useEffect(() => {
    if (!game?.result) {
      gameResultModalKeyRef.current = null
      setEndGameModal(null)
      return
    }

    const modalKey = `${game.result.winnerTeam}-${game.result.reason}-${game.endedAt ?? ''}`
    if (gameResultModalKeyRef.current === modalKey) {
      return
    }

    gameResultModalKeyRef.current = modalKey

    const winnerLabel = game.result?.winnerTeam === 'Red' ? '🔴 Червени' : '🔵 Сини'
    setEndGameModal({ winnerLabel, reason: game.result?.reason ?? '' })
  }, [game?.result, game?.endedAt])

  useEffect(() => {
    if (currentPhase !== 'TeamGuessing' || !!game?.result) {
      setShowGuessPhasePopup(false)
      return
    }

    setShowGuessPhasePopup(true)
    const timer = window.setTimeout(() => setShowGuessPhasePopup(false), 2000)
    return () => window.clearTimeout(timer)
  }, [currentPhase, currentGameTeam, game?.result])

  useEffect(() => {
    if (!game) return

    if (lastGameCreatedAtRef.current !== game.createdAt) {
      lastGameCreatedAtRef.current = game.createdAt
      activeHistoryKeyRef.current = null
      setClueHistory([])
    }

    if (!game.currentClue) return
    const team = normalizeTeam(game.currentTeam)
    if (!team) return

    const signature = `${team}|${game.currentClue}|${game.currentClueNumber}`
    const totalForTeam = team === 'Red'
      ? (normalizeTeam(game.startingTeam) === 'Red' ? 9 : 8)
      : (normalizeTeam(game.startingTeam) === 'Blue' ? 9 : 8)
    const remainingForTeam = team === 'Red' ? game.redCardsRemaining : game.blueCardsRemaining

    setClueHistory((previous) => {
      if (activeHistoryKeyRef.current !== signature) {
        activeHistoryKeyRef.current = signature
        const newItem: ClueHistoryItem = {
          id: `${Date.now()}-${Math.random()}`,
          team,
          clue: game.currentClue ?? '',
          number: game.currentClueNumber,
          total: totalForTeam,
          remaining: remainingForTeam
        }
        return [newItem, ...previous].slice(0, 10)
      }

      return previous.map((item, index) => {
        if (index !== 0 || item.team !== team || item.clue !== game.currentClue || item.number !== game.currentClueNumber) {
          return item
        }

        return {
          ...item,
          remaining: remainingForTeam
        }
      })
    })
  }, [game?.createdAt, game?.currentClue, game?.currentClueNumber, game?.currentTeam, game?.startingTeam, game?.redCardsRemaining, game?.blueCardsRemaining, game?.result])

  const handleStartNewGame = async () => {
    if (!roomId) {
      navigate('/catalog')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const newGame = await roomsApi.startCodenamesGame(roomId)
      if (shouldRevealKey) {
        const revealedGame = await roomsApi.getCodenamesGame(roomId, true)
        setGame(revealedGame)
      } else {
        setGame(newGame)
      }
      setGuessFeedback(null)
      setHoveredWord(null)
      setEndGameModal(null)
    } catch (err) {
      gameResultModalKeyRef.current = null
      setError(err instanceof Error ? err.message : 'Неуспешен старт на нова игра')
    } finally {
      setIsSubmitting(false)
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

  const isSpymaster = activeRole === 'Spymaster'
  const canGiveClue = !!game && !game.result && currentPhase === 'SpymasterClue' && (isTester || (isCurrentPlayerTeamTurn && isSpymaster))
  const canSelectGuesses = !!game && !game.result && currentPhase === 'TeamGuessing' && (isTester || isCurrentPlayerTeamTurn)
  const isBlueTurn = currentGameTeam === 'Blue'
  const isRedTurn = currentGameTeam === 'Red'
  const bluePanelClass = isBlueTurn
    ? (isDarkMode
      ? 'border-blue-800 bg-blue-950/30 ring-2 ring-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]'
      : 'border-blue-200 bg-blue-50 ring-2 ring-blue-300')
    : (isDarkMode ? 'border-slate-700 bg-slate-800/70' : 'border-slate-300 bg-slate-100')
  const redPanelClass = isRedTurn
    ? (isDarkMode
      ? 'border-red-800 bg-red-950/30 ring-2 ring-red-400 shadow-[0_0_0_2px_rgba(239,68,68,0.25)]'
      : 'border-red-200 bg-red-50 ring-2 ring-red-300')
    : (isDarkMode ? 'border-slate-700 bg-slate-800/70' : 'border-slate-300 bg-slate-100')

  const getCardClass = (card: CodenamesCardDto): string => {
    const isHovered = hoveredWord === card.word
    const normalizedCardTeam = normalizeCardTeam(card.team)
    const hasVisibleKey = !card.isRevealed && normalizedCardTeam !== null

    if (hasVisibleKey) {
      let baseClass = ''

      if (normalizedCardTeam === 'Red') {
        baseClass = 'border-red-500 bg-red-600 text-white'
      }
      else if (normalizedCardTeam === 'Blue') {
        baseClass = 'border-blue-500 bg-blue-600 text-white'
      }
      else if (normalizedCardTeam === 'Assassin') baseClass = 'border-2 border-slate-900 bg-black text-white shadow-[0_0_0_2px_rgba(255,255,255,0.08)]'
      else {
        baseClass = isDarkMode
          ? 'border-2 border-yellow-400 bg-yellow-700 text-white'
          : 'border-2 border-yellow-500 bg-yellow-200 text-slate-900'
      }

      if (isHovered) {
        return `${baseClass} ring-2 ring-white/80`
      }

      return baseClass
    }

    if (!card.isRevealed) {
      const base = isDarkMode
        ? 'border-slate-700 bg-slate-700 text-slate-100 hover:bg-slate-600'
        : 'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'

      if (isHovered) {
        return `${base} ring-1 ${currentGameTeam === 'Red' ? 'ring-red-300' : 'ring-blue-300'}`
      }

      return base
    }

    if (normalizedCardTeam === 'Red') return 'border-red-600 bg-red-600 text-white'
    if (normalizedCardTeam === 'Blue') return 'border-blue-600 bg-blue-600 text-white'
    if (normalizedCardTeam === 'Assassin') return 'border-slate-900 bg-slate-900 text-white'
    return 'border-slate-300 bg-slate-300 text-slate-900'
  }

  const refreshVisibleGame = async (fallbackGame?: CodenamesGameDto) => {
    if (!roomId) {
      if (fallbackGame) {
        setGame(fallbackGame)
      }
      return
    }

    if (!shouldRevealKey) {
      if (fallbackGame) {
        setGame(fallbackGame)
      }
      return
    }

    const revealedGame = await roomsApi.getCodenamesGame(roomId, true)
    setGame(revealedGame)
  }

  const handleSetClue = async () => {
    if (!roomId || !game) return

    const normalizedClue = clue.trim()
    const parsedNumber = Number(clueNumber)

    if (!normalizedClue || Number.isNaN(parsedNumber) || parsedNumber < 1) {
      setError('Въведи валиден жокер и число >= 1.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const updated = await roomsApi.setCodenamesClue(roomId, normalizedClue, parsedNumber)
      await refreshVisibleGame(updated)
      setClue('')
      setClueNumber('1')
      setCorrectGuessesInTurn(0)
      setGuessFeedback({ text: `🎯 Асоциация: ${normalizedClue.toUpperCase()} (${parsedNumber})`, tone: 'good' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно задаване на жокер')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClueWordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    clueNumberInputRef.current?.focus()
    clueNumberInputRef.current?.select()
  }

  const handleClueNumberKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()

    if (!isSubmitting && canGiveClue) {
      void handleSetClue()
    }
  }

  const handleGuess = async (word: string) => {
    if (!roomId || !game || currentPhase !== 'TeamGuessing' || game.result) return

    setIsSubmitting(true)
    setError('')

    try {
      // Запазваме текущия team ПРЕДИ guess-a
      const teamBeforeGuess = game.currentTeam

      const response = await roomsApi.guessCodenamesWord(roomId, word)
      const normalizedGuessResult = normalizeGuessResult(response.guessResult)

      // Ако е правилна дума, броим я
      let newCorrectCount = correctGuessesInTurn
      if (normalizedGuessResult === 'CorrectTeam' || normalizedGuessResult === 'CorrectTeamTurnEnds') {
        newCorrectCount = correctGuessesInTurn + 1
        setCorrectGuessesInTurn(newCorrectCount)
      }

      // Проверяваме дали backend-ът вече е сменил team-a
      const backendChangedTeam = teamBeforeGuess !== response.game.currentTeam

      // Ходът преминава към другия отбор ако:
      // - Достигнат е лимитът на думи (N думи според асоциацията)
      // - Последната дума на текущия отбор е отворена (CorrectTeamTurnEnds)
      // - Неутрална дума (другия отбор е на ход)
      // - Дума на другия отбор (другия отбор е на ход)
      // Забележка: При Assassin играта приключва, не преминаваме ход
      const reachedLimit = response.game.currentClueNumber && newCorrectCount >= response.game.currentClueNumber
      const shouldEndTurn =
        reachedLimit ||
        normalizedGuessResult === 'CorrectTeamTurnEnds' ||
        normalizedGuessResult === 'Neutral' ||
        normalizedGuessResult === 'EnemyTeam'

      console.log('🎯 Guess result:', {
        word,
        result: normalizedGuessResult,
        correctCount: newCorrectCount,
        clueNumber: response.game.currentClueNumber,
        reachedLimit,
        shouldEndTurn,
        teamBeforeGuess,
        teamAfterGuess: response.game.currentTeam,
        backendChangedTeam
      })

      // Ако backend-ът вече е сменил team-a, само refresh-ваме
      if (backendChangedTeam) {
        console.log('✅ Backend already changed team. Just refreshing.')
        setCorrectGuessesInTurn(0)
        await refreshVisibleGame(response.game)
      } else if (shouldEndTurn && roomId) {
        // Ако трябва да сменим ход, викаме endCodenamesTurn
        console.log('⚡ Ending turn for team:', response.game.currentTeam)
        setTurnJustEnded(true)
        setCorrectGuessesInTurn(0)
        await roomsApi.endCodenamesTurn(roomId)
        const updatedGame = await roomsApi.getCodenamesGame(roomId, shouldRevealKey)
        console.log('✅ Turn ended. New team:', updatedGame.currentTeam)
        setGame(updatedGame)
        setTurnJustEnded(false)
      } else {
        // Само ако не се сменя ходът, правим refresh
        await refreshVisibleGame(response.game)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно гадаене')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDoubleClickGuess = async (word: string) => {
    if (isSubmitting) return
    const canGuess = canSelectGuesses || (showTesterMode && !!game && !game.result)
    if (!canGuess) return

    await handleGuess(word)
  }

  const handleCardSingleClick = (word: string) => {
    if (!game || !!game.result || (currentPhase !== 'TeamGuessing' && !showTesterMode) || isSubmitting) return

    const card = game.cards.find((item) => item.word === word)
    if (!card || card.isRevealed) return

    const nextWord = hoveredWord === word ? null : word
    setHoveredWord(nextWord)

    if (!roomId || !playerId) return
    void updateWordHover(roomId, playerId, nextWord)
  }

  if (!game) {
    return (
      <div className={`min-h-dvh flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <p className={isDarkMode ? 'text-slate-100' : 'text-slate-900'}>Играта още не е стартирана.</p>
      </div>
    )
  }

  const bluePlayers = room.players.filter((player) => normalizeTeam(player.team) === 'Blue')
  const redPlayers = room.players.filter((player) => normalizeTeam(player.team) === 'Red')
  const blueSpymasters = bluePlayers.filter((player) => normalizeRole(player.role) === 'Spymaster')
  const redSpymasters = redPlayers.filter((player) => normalizeRole(player.role) === 'Spymaster')
  const blueOperatives = bluePlayers.filter((player) => normalizeRole(player.role) !== 'Spymaster')
  const redOperatives = redPlayers.filter((player) => normalizeRole(player.role) !== 'Spymaster')

  return (
    <main className={`relative h-dvh overflow-hidden px-2 py-2 sm:px-3 sm:py-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {showGuessPhasePopup ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-4">
          <div className={`rounded-xl border px-6 py-4 text-lg font-extrabold shadow-2xl ${currentGameTeam === 'Red'
            ? (isDarkMode ? 'border-red-400/80 bg-red-900/95 text-red-100' : 'border-red-400 bg-red-100 text-red-900')
            : (isDarkMode ? 'border-blue-400/80 bg-blue-900/95 text-blue-100' : 'border-blue-400 bg-blue-100 text-blue-900')}`}>
            Фаза за отговаряне
          </div>
        </div>
      ) : null}

      {endGameModal ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className={`w-full max-w-md rounded-xl border p-5 ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
            <p className="text-lg font-bold">Край на играта</p>
            <p className="mt-2 text-sm opacity-90">Победител: {endGameModal.winnerLabel}</p>
            <p className="text-sm opacity-80">Причина: {endGameModal.reason}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void handleStartNewGame()}
                disabled={isSubmitting}
                className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Нова игра
              </button>
              <button
                onClick={() => navigate('/catalog')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold ${isDarkMode ? 'border-slate-500 text-slate-100' : 'border-slate-300 text-slate-900'}`}
              >
                Изход
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`mx-auto flex h-full max-w-7xl flex-col rounded-lg border p-2 sm:p-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/lobby/${roomId}`)}
            className={`rounded-md border px-3 py-1 text-sm font-medium ${isDarkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-700' : 'border-slate-300 text-slate-900 hover:bg-slate-50'}`}
          >
            Назад
          </button>
          <div className="flex-1 text-center">
            {currentPhase === 'TeamGuessing' && !game.result ? (
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Single click маркира дума, double click я отваря.
              </p>
            ) : null}
          </div>
          <div className="w-[66px]" aria-hidden="true" />
        </div>

        <div className="mt-2 grid min-h-0 flex-1 gap-2 lg:gap-3 xl:grid-cols-[210px_minmax(0,1fr)_210px]">
          <aside className={`order-2 rounded-lg border p-2 transition xl:order-1 ${bluePanelClass}`}>
            <div className={`mb-2 rounded-md border px-2 py-1 text-center ${isBlueTurn
              ? (isDarkMode ? 'border-blue-700/60 bg-blue-900/30' : 'border-blue-200 bg-blue-50')
              : (isDarkMode ? 'border-slate-600 bg-slate-700/70' : 'border-slate-300 bg-slate-100')}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isBlueTurn ? (isDarkMode ? 'text-blue-300' : 'text-blue-700') : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Сини думи</p>
              <p className={`text-xl font-black leading-none ${isBlueTurn ? (isDarkMode ? 'text-blue-200' : 'text-blue-700') : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>{game.blueCardsRemaining}</p>
            </div>
            <p className={`text-sm font-semibold ${isBlueTurn ? 'text-blue-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Полеви агенти</p>
            <div className="mt-2 space-y-1 text-sm">
              {blueOperatives.map((player) => (
                <div key={player.playerId} className={`rounded px-2 py-1 ${isBlueTurn
                  ? (isDarkMode ? 'bg-blue-900/40 text-blue-100' : 'bg-blue-100 text-blue-900')
                  : (isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700')}`}>
                  {player.name}
                </div>
              ))}
            </div>
            <p className={`mt-3 text-sm font-semibold ${isBlueTurn ? 'text-blue-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Координатор</p>
            <div className="mt-2 space-y-1 text-sm">
              {blueSpymasters.map((player) => (
                <div key={player.playerId} className={`rounded px-2 py-1 ${isBlueTurn
                  ? (isDarkMode ? 'bg-cyan-900/40 text-cyan-100' : 'bg-cyan-100 text-cyan-900')
                  : (isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700')}`}>
                  {player.name}
                </div>
              ))}
            </div>
          </aside>

          <section className="order-1 flex min-h-0 flex-col xl:order-2">
            {!(!showTesterMode && activeRole === 'Operative') ? (
              <div className={`rounded-lg p-3 ${currentGameTeam === 'Red'
                ? (isDarkMode ? 'bg-slate-700' : 'bg-red-50/40')
                : (isDarkMode ? 'bg-slate-700' : 'bg-blue-50/40')}`}>
                {currentPhase === 'SpymasterClue' && !game.result ? (
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <input
                      ref={clueInputRef}
                      value={clue}
                      onChange={(event) => setClue(event.target.value)}
                      onKeyDown={handleClueWordKeyDown}
                      placeholder="Дума"
                      disabled={!canGiveClue || isSubmitting}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm ${currentGameTeam === 'Red'
                        ? (isDarkMode ? 'border-red-500/60 bg-red-950/30 text-slate-100 placeholder:text-red-200/70' : 'border-red-300 bg-red-50 text-slate-900 placeholder:text-red-500/70')
                        : (isDarkMode ? 'border-blue-500/60 bg-blue-950/30 text-slate-100 placeholder:text-blue-200/70' : 'border-blue-300 bg-blue-50 text-slate-900 placeholder:text-blue-500/70')}`}
                    />
                    <input
                      ref={clueNumberInputRef}
                      value={clueNumber}
                      onChange={(event) => setClueNumber(event.target.value)}
                      onKeyDown={handleClueNumberKeyDown}
                      type="number"
                      min={1}
                      disabled={!canGiveClue || isSubmitting}
                      className={`w-20 rounded-md border px-3 py-2 text-sm ${currentGameTeam === 'Red'
                        ? (isDarkMode ? 'border-red-500/60 bg-red-950/30 text-slate-100' : 'border-red-300 bg-red-50 text-slate-900')
                        : (isDarkMode ? 'border-blue-500/60 bg-blue-950/30 text-slate-100' : 'border-blue-300 bg-blue-50 text-slate-900')}`}
                    />
                    <button
                      onClick={handleSetClue}
                      disabled={isSubmitting || !canGiveClue}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Потвърди
                    </button>
                  </div>
                ) : null}

                {game.currentClue ? (
                  <div className={`mt-2 rounded-lg border p-2.5 ${currentGameTeam === 'Red'
                    ? (isDarkMode ? 'border-red-500/50 bg-red-900/20' : 'border-red-300 bg-red-50')
                    : (isDarkMode ? 'border-blue-500/50 bg-blue-900/20' : 'border-blue-300 bg-blue-50')}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${currentGameTeam === 'Red'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'}`}>
                        АСОЦИАЦИЯ
                      </span>
                      <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Свързани думи: {game.currentClueNumber}
                      </span>
                    </div>
                    <p className={`mt-2 text-lg font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {game.currentClue.toUpperCase()}
                    </p>
                  </div>
                ) : null}

                {guessFeedback ? (
                  <div className={`mt-3 animate-pulse rounded-md px-3 py-2 text-sm font-semibold ${guessFeedback.tone === 'good'
                    ? 'bg-emerald-600 text-white'
                    : guessFeedback.tone === 'bad'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-500 text-white'}`}>
                    {guessFeedback.text}
                  </div>
                ) : null}

                {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
              </div>
            ) : null}

            <div className="mt-2 grid min-h-0 flex-1 grid-cols-5 grid-rows-5 gap-1">
              {game.cards.map((card, index) => (
                <button
                  key={`${card.word}-${index}`}
                  onClick={() => handleCardSingleClick(card.word)}
                  onDoubleClick={() => void handleDoubleClickGuess(card.word)}
                  disabled={isSubmitting || card.isRevealed || !!game.result || (currentPhase !== 'TeamGuessing' && !showTesterMode) || turnJustEnded}
                  className={`relative h-full min-h-0 rounded-md border p-1 text-center text-[10px] font-semibold transition sm:text-[11px] disabled:cursor-not-allowed disabled:opacity-70 ${getCardClass(card)} ${card.isRevealed ? 'brightness-75 saturate-75' : ''}`}
                >
                  {card.word}
                  {room.players
                    .filter((player) => player.playerId !== playerId && hoverPointers[player.playerId] === card.word)
                    .slice(0, 2)
                    .map((player) => (
                      <span
                        key={player.playerId}
                        className={`ml-1 inline-block rounded px-1 text-[10px] font-medium ${normalizeTeam(player.team) === 'Red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                      >
                        {player.name}
                      </span>
                    ))}
                </button>
              ))}
            </div>

            <div className={`mt-2 h-[92px] rounded-lg border p-2 ${isDarkMode ? 'border-slate-600 bg-slate-800/70' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Хронология на асоциации
              </p>
              <div className="mt-1.5 h-[54px] space-y-1 overflow-hidden text-xs">
                {clueHistory.length === 0 ? (
                  <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Няма въведени асоциации.</p>
                ) : clueHistory.slice(0, 2).map((item) => {
                  const guessed = item.total - item.remaining
                  return (
                    <div key={item.id} className={`rounded px-2 py-1 leading-tight ${isDarkMode ? 'bg-slate-700/70 text-slate-100' : 'bg-white text-slate-900'}`}>
                      <span className={`mr-1 font-semibold ${item.team === 'Red' ? 'text-red-500' : 'text-blue-500'}`}>
                        {item.team === 'Red' ? 'Червени' : 'Сини'}
                      </span>
                      <span className="font-semibold">{item.clue.toUpperCase()}</span>
                      <span className="opacity-80"> ({item.number})</span>
                      <span className="ml-2 opacity-80">познати: {guessed}</span>
                      <span className="ml-2 opacity-80">непознати: {item.remaining}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </section>

          <aside className={`order-3 rounded-lg border p-2 transition ${redPanelClass}`}>
            <div className={`mb-2 rounded-md border px-2 py-1 text-center ${isRedTurn
              ? (isDarkMode ? 'border-red-700/60 bg-red-900/30' : 'border-red-200 bg-red-50')
              : (isDarkMode ? 'border-slate-600 bg-slate-700/70' : 'border-slate-300 bg-slate-100')}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${isRedTurn ? (isDarkMode ? 'text-red-300' : 'text-red-700') : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Червени думи</p>
              <p className={`text-xl font-black leading-none ${isRedTurn ? (isDarkMode ? 'text-red-200' : 'text-red-700') : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>{game.redCardsRemaining}</p>
            </div>
            <p className={`text-sm font-semibold ${isRedTurn ? 'text-red-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Полеви агенти</p>
            <div className="mt-2 space-y-1 text-sm">
              {redOperatives.map((player) => (
                <div key={player.playerId} className={`rounded px-2 py-1 ${isRedTurn
                  ? (isDarkMode ? 'bg-red-900/40 text-red-100' : 'bg-red-100 text-red-900')
                  : (isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700')}`}>
                  {player.name}
                </div>
              ))}
            </div>
            <p className={`mt-3 text-sm font-semibold ${isRedTurn ? 'text-red-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>Координатор</p>
            <div className="mt-2 space-y-1 text-sm">
              {redSpymasters.map((player) => (
                <div key={player.playerId} className={`rounded px-2 py-1 ${isRedTurn
                  ? (isDarkMode ? 'bg-orange-900/40 text-orange-100' : 'bg-orange-100 text-orange-900')
                  : (isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700')}`}>
                  {player.name}
                </div>
              ))}
            </div>
          </aside>
        </div>

      </div>
    </main>
  )
}
