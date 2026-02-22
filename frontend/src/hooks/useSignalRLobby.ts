import { useEffect, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { RoomDetailsDto } from '../lib/api'

const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5000/hub/lobby'

export type RoomEvent = 'PlayerJoined' | 'PlayerLeft' | 'PlayerReadyChanged' | 'GameStarted'

export const useSignalRLobby = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomData, setRoomData] = useState<RoomDetailsDto | null>(null)

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
    }

    const handlePlayerReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      console.log('Player ready changed:', data)
    }

    const handleGameStarted = (data: { roomId: string; timestamp: string }) => {
      console.log('Game started:', data)
    }

    // Register event listeners
    newConnection.on('PlayerJoined', handlePlayerJoined)
    newConnection.on('PlayerLeft', handlePlayerLeft)
    newConnection.on('PlayerReadyChanged', handlePlayerReadyChanged)
    newConnection.on('GameStarted', handleGameStarted)

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

      // Stop the connection
      void newConnection.stop()
    }
  }, [])

  const joinLobby = async (roomId: string, playerId: string) => {
    if (connection) {
      await connection.invoke('JoinLobby', roomId, playerId)
    }
  }

  const leaveLobby = async (roomId: string, playerId: string) => {
    if (connection) {
      await connection.invoke('LeaveLobby', roomId, playerId)
    }
  }

  const setPlayerReady = async (roomId: string, playerId: string, isReady: boolean) => {
    if (connection) {
      await connection.invoke('SetPlayerReady', roomId, playerId, isReady)
    }
  }

  const startGame = async (roomId: string) => {
    if (connection) {
      await connection.invoke('StartGame', roomId)
    }
  }

  return {
    connection,
    isConnected,
    roomData,
    joinLobby,
    leaveLobby,
    setPlayerReady,
    startGame,
    setRoomData
  }
}
