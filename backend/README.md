# MyGamesPortal Backend

ASP.NET Core Web API with SignalR for multiplayer room management and real-time lobby updates.

## Prerequisites

- .NET 8.0 SDK
- Visual Studio / VS Code

## Project Structure

- **Domain/** — Core models (Room, Player)
- **Contracts/** — DTOs and request/response objects
- **Services/** — Business logic (RoomService)
- **Controllers/** — REST API endpoints
- **Hubs/** — SignalR hub for real-time communication

## Getting Started

### 1. Install Dependencies

```bash
cd backend
dotnet restore
```

### 2. Build the Project

```bash
dotnet build
```

### 3. Run the Backend

**Default (localhost:5000):**
```bash
dotnet run
```

**With Custom Port:**
```bash
dotnet run -- --urls "http://localhost:5001"
```

### 4. Configure Frontend Connection

Update frontend's API base and SignalR hub URL to match your backend instance.

## API Endpoints

### Create Room
```http
POST /api/rooms
Content-Type: application/json

{
  "gameKey": "codenames",
  "hostName": "Alice"
}
```

**Response:**
```json
{
  "roomId": "...",
  "gameKey": "codenames",
  "inviteCode": "ABC12345",
  "inviteUrl": "http://localhost:5000/join/ABC12345",
  "room": { "roomId": "...", "players": [...] }
}
```

### Get Room by Invite Code
```http
GET /api/rooms/by-invite/{inviteCode}
```

### Join Room
```http
POST /api/rooms/{roomId}/join
Content-Type: application/json

{
  "playerName": "Bob"
}
```

### Get Room Details
```http
GET /api/rooms/{roomId}
```

## SignalR Hub Events

**Endpoint:** `ws://localhost:5000/`

### Client → Server

- `JoinLobby(roomId, playerId)` — Enter room lobby
- `LeaveLobby(roomId, playerId)` — Leave room
- `SetPlayerReady(roomId, playerId, isReady)` — Mark ready status
- `StartGame(roomId)` — Initiate game

### Server → Client

- `PlayerJoined(playerId, room)` — New player joined
- `PlayerLeft(playerId, room)` — Player left
- `PlayerReadyChanged(playerId, isReady)` — Ready status changed
- `GameStarted(roomId, timestamp)` — Game started

## Database Migration (Future)

When moving from in-memory to SQL:
1. Replace `InMemoryRoomService` with `SqlRoomService`
2. Add Entity Framework Core DbContext
3. Add migration scripts in `Data/Migrations/`

## Deployment

- Update `appsettings.json`: `FrontendOrigin` and `BaseUrl` for production URLs
- Use environment variables for sensitive configs
- Enable HTTPS enforcement
- Deploy to: Azure App Service, Render, Railway, Fly.io, or similar

---

## Development Notes

- Currently uses in-memory store (not persistent across restarts)
- No authentication/authorization yet (add JWT bearer token after MVP)
- SignalR uses server-to-group broadcasting (perfect for lobby-scale players)

