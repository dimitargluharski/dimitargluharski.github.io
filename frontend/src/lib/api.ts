const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export interface PlayerDto {
  playerId: string
  name: string
  isHost: boolean
  joinedAtUtc: string
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
  }
}
