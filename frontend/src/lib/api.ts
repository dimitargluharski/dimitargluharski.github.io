const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'https://my-games-backend-nmx5.onrender.com').replace(/\/+$/, '')
const API_BASE = import.meta.env.VITE_API_BASE || `${BACKEND_BASE_URL}/api`

export type CardTeam = 'Red' | 'Blue' | 'Neutral' | 'Assassin'
export type GamePhase = 'SpymasterClue' | 'TeamGuessing' | 'GameOver'

export interface CodenamesCardDto {
  word: string
  isRevealed: boolean
  team: CardTeam | null
}

export interface CodenamesResultDto {
  winnerTeam: CardTeam
  reason: string
  endReason: 'AllCardsRevealed' | 'AssassinRevealed'
}

export interface CodenamesGameDto {
  roomId: string
  startingTeam: CardTeam
  currentTeam: CardTeam
  phase: GamePhase
  currentClue: string | null
  currentClueNumber: number
  guessesRemaining: number
  redCardsRemaining: number
  blueCardsRemaining: number
  cards: CodenamesCardDto[]
  result: CodenamesResultDto | null
  createdAt: string
  endedAt: string | null
}

export interface GuessWordResponseDto {
  guessResult: 'InvalidPhase' | 'NotFound' | 'AlreadyRevealed' | 'CorrectTeam' | 'CorrectTeamTurnEnds' | 'Neutral' | 'EnemyTeam' | 'Assassin' | 'Unknown'
  game: CodenamesGameDto
}

export interface PlayerDto {
  playerId: string
  name: string
  isHost: boolean
  joinedAtUtc: string
  team: 'Red' | 'Blue'
  role: 'Operative' | 'Spymaster' | 'Tester'
}

export interface RoomDetailsDto {
  roomId: string
  gameKey: string
  inviteCode: string
  createdAtUtc: string
  players: PlayerDto[]
}

export interface CreateRoomResponse {
  roomId: string
  gameKey: string
  inviteCode: string
  inviteUrl: string
  room: RoomDetailsDto
}

export interface JoinRoomResponse {
  player: PlayerDto
  room: RoomDetailsDto
}

export interface UpdateAssignmentResponse {
  player: PlayerDto
  room: RoomDetailsDto
}

export interface RandomizeAssignmentsResponse {
  room: RoomDetailsDto
}

export const roomsApi = {
  async createRoom(gameKey: string, hostName?: string): Promise<CreateRoomResponse> {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameKey, hostName })
    })

    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.statusText}`)
    }

    return response.json()
  },

  async getRoomByInviteCode(inviteCode: string): Promise<RoomDetailsDto> {
    const response = await fetch(`${API_BASE}/rooms/by-invite/${inviteCode}`)

    if (!response.ok) {
      throw new Error(`Failed to get room: ${response.statusText}`)
    }

    return response.json()
  },

  async getRoomById(roomId: string): Promise<RoomDetailsDto> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}`)

    if (!response.ok) {
      throw new Error(`Failed to get room: ${response.statusText}`)
    }

    return response.json()
  },

  async joinRoom(roomId: string, playerName: string): Promise<JoinRoomResponse> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    })

    if (!response.ok) {
      throw new Error(`Failed to join room: ${response.statusText}`)
    }

    return response.json()
  },

  async updatePlayerAssignment(
    roomId: string,
    playerId: string,
    team: 'Random' | 'Red' | 'Blue',
    role: 'Operative' | 'Spymaster' | 'Tester'
  ): Promise<UpdateAssignmentResponse> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/players/${playerId}/assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, role })
    })

    if (!response.ok) {
      throw new Error(`Failed to update assignment: ${response.statusText}`)
    }

    return response.json()
  },

  async randomizeAssignments(roomId: string): Promise<RandomizeAssignmentsResponse> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/randomize`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error(`Failed to randomize assignments: ${response.statusText}`)
    }

    return response.json()
  },

  async startCodenamesGame(roomId: string): Promise<CodenamesGameDto> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/codenames/start`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error(`Failed to start game: ${response.statusText}`)
    }

    return response.json()
  },

  async getCodenamesGame(roomId: string, revealKey = false): Promise<CodenamesGameDto> {
    const query = revealKey ? '?revealKey=true' : ''
    const response = await fetch(`${API_BASE}/rooms/${roomId}/codenames${query}`)

    if (!response.ok) {
      throw new Error(`Failed to load game: ${response.statusText}`)
    }

    return response.json()
  },

  async setCodenamesClue(roomId: string, clue: string, number: number): Promise<CodenamesGameDto> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/codenames/clue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clue, number })
    })

    if (!response.ok) {
      throw new Error(`Failed to set clue: ${response.statusText}`)
    }

    return response.json()
  },

  async guessCodenamesWord(roomId: string, word: string): Promise<GuessWordResponseDto> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/codenames/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    })

    if (!response.ok) {
      throw new Error(`Failed to submit guess: ${response.statusText}`)
    }

    return response.json()
  },

  async endCodenamesTurn(roomId: string): Promise<CodenamesGameDto> {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/codenames/end-turn`, {
      method: 'POST'
    })

    if (!response.ok) {
      throw new Error(`Failed to end turn: ${response.statusText}`)
    }

    return response.json()
  }
}
