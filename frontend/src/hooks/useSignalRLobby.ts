import { useEffect, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { RoomDetailsDto } from '../lib/api'

const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'https://my-games-backend-nmx5.onrender.com').replace(/\/+$/, '')
const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || BACKEND_BASE_URL

export type RoomEvent = 'PlayerJoined' | 'PlayerLeft' | 'PlayerReadyChanged' | 'GameStarted'

export const useSignalRLobby = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomData, setRoomData] = useState<RoomDetailsDto | null>(null)
  const [hoverPointers, setHoverPointers] = useState<Record<string, string | null>>({})
  const [selectionPointers, setSelectionPointers] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build()

    // Define event handlers
    const handlePlayerJoined = (data: { playerId: string; room: RoomDetailsDto }) => {
      setRoomData(data.room)
    }

    const handlePlayerLeft = (data: { playerId: string; room: RoomDetailsDto }) => {
      setRoomData(data.room)
      setHoverPointers((previous) => {
        const next = { ...previous }
        delete next[data.playerId]
        return next
      })
      setSelectionPointers((previous) => {
        const next = { ...previous }
        delete next[data.playerId]
        return next
      })
    }

    const handlePlayerReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      console.log('Player ready changed:', data)
    }

    const handleGameStarted = (data: { roomId: string; timestamp: string }) => {
      console.log('Game started:', data)
    }

    const handlePlayerAssignmentUpdated = (data: { playerId: string; room: RoomDetailsDto }) => {
      setRoomData(data.room)
    }

    const handlePlayerWordHoverUpdated = (data: { playerId: string; word: string | null }) => {
      setHoverPointers((previous) => ({
        ...previous,
        [data.playerId]: data.word
      }))
    }

    const handlePlayerWordSelectionUpdated = (data: { playerId: string; word: string; isSelected: boolean }) => {
      setSelectionPointers((previous) => {
        const current = previous[data.playerId] ?? []

        if (data.isSelected) {
          if (current.includes(data.word)) {
            return previous
          }

          return {
            ...previous,
            [data.playerId]: [...current, data.word]
          }
        }

        return {
          ...previous,
          [data.playerId]: current.filter((word) => word !== data.word)
        }
      })
    }

    // Register event listeners
    newConnection.on('PlayerJoined', handlePlayerJoined)
    newConnection.on('PlayerLeft', handlePlayerLeft)
    newConnection.on('PlayerReadyChanged', handlePlayerReadyChanged)
    newConnection.on('GameStarted', handleGameStarted)
    newConnection.on('PlayerAssignmentUpdated', handlePlayerAssignmentUpdated)
    newConnection.on('PlayerWordHoverUpdated', handlePlayerWordHoverUpdated)
    newConnection.on('PlayerWordSelectionUpdated', handlePlayerWordSelectionUpdated)

    newConnection
      .start()
      .then(() => {
        setIsConnected(true)
        setConnection(newConnection)
      })
      .catch((err: unknown) => console.error('SignalR connection error:', err))

    return () => {
      // Unsubscribe from all events before disconnecting
      newConnection.off('PlayerJoined', handlePlayerJoined)
      newConnection.off('PlayerLeft', handlePlayerLeft)
      newConnection.off('PlayerReadyChanged', handlePlayerReadyChanged)
      newConnection.off('GameStarted', handleGameStarted)
      newConnection.off('PlayerAssignmentUpdated', handlePlayerAssignmentUpdated)
      newConnection.off('PlayerWordHoverUpdated', handlePlayerWordHoverUpdated)
      newConnection.off('PlayerWordSelectionUpdated', handlePlayerWordSelectionUpdated)

      // Stop the connection
      void newConnection.stop()
    }
  }, [])

  const joinLobby = async (roomId: string, playerId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('JoinLobby', roomId, playerId)
    }
  }

  const leaveLobby = async (roomId: string, playerId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('LeaveLobby', roomId, playerId)
    }
  }

  const setPlayerReady = async (roomId: string, playerId: string, isReady: boolean) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('SetPlayerReady', roomId, playerId, isReady)
    }
  }

  const startGame = async (roomId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('StartGame', roomId)
    }
  }

  const updatePlayerAssignment = async (
    roomId: string,
    playerId: string,
    team: 'Random' | 'Red' | 'Blue',
    role: 'Operative' | 'Spymaster' | 'Tester'
  ) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('UpdatePlayerAssignment', roomId, playerId, team, role)
    }
  }

  const randomizeAssignments = async (roomId: string) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('RandomizeAssignments', roomId)
    }
  }

  const updateWordHover = async (roomId: string, playerId: string, word: string | null) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('UpdateWordHover', roomId, playerId, word)
    }
  }

  const updateWordSelection = async (roomId: string, playerId: string, word: string, isSelected: boolean) => {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('UpdateWordSelection', roomId, playerId, word, isSelected)
    }
  }

  return {
    connection,
    isConnected,
    roomData,
    hoverPointers,
    selectionPointers,
    joinLobby,
    leaveLobby,
    setPlayerReady,
    startGame,
    updatePlayerAssignment,
    randomizeAssignments,
    updateWordHover,
    updateWordSelection,
    setRoomData
  }
}
