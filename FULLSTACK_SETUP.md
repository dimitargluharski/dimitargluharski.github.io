# MyGamesPortal — Full Stack Setup

## Quick Start (Local Development)

### 1. Terminal 1 — Backend

```bash
cd backend
dotnet restore
dotnet run
```

Backend starts at: `http://localhost:5000`

### 2. Terminal 2 — Frontend

```bash
cd frontend
npm install  # (if needed)
npm run dev
```

Frontend starts at: `http://localhost:5173`

---

## Flow Test

1. **Open frontend:** http://localhost:5173
2. **Login:** Enter any name, go to catalog
3. **Create Room:** Click "Създай стая" → Creates room + auto-joins lobby
   - Copy invite code (or invite URL from backend response)
4. **Join from Another Tab/Browser:**
   - Open: `http://localhost:5173/join/{INVITE_CODE}`
   - Enter name (other) → Join lobby with friend
5. **Real-time Sync:** SignalR updates players list live
6. **Start Game:** Host clicks "Начало на игра"

---

## Architecture

### Frontend (`/frontend`)
- **React 19** + TypeScript
- **Vite** for dev/build
- **TailwindCSS** for styling + system theme detection
- **SignalR client** for real-time updates
- **Pages:** Login → Catalog → JoinGame/Lobby

**Key Files:**
- `src/lib/api.ts` — REST client
- `src/hooks/useSignalRLobby.ts` — SignalR connection
- `src/pages/CatalogPage.tsx` — Game selection + room creation
- `src/pages/JoinGamePage.tsx` — Invite code join flow
- `src/pages/LobbyPage.tsx` — Room with players list

### Backend (`/backend`)
- **ASP.NET Core 8** Web API
- **SignalR** for real-time broadcasts
- **In-memory store** (upgrade to SQL later)
- **CORS** enabled for frontend

**Key Files:**
- `Services/RoomService.cs` — Room/Player CRUD
- `Controllers/RoomsController.cs` — REST endpoints
- `Hubs/LobbyHub.cs` — SignalR events
- `Program.cs` — App configuration

---

## Environment Variables

### Frontend (`.env.local`)
```
VITE_BACKEND_URL=https://my-games-backend-nmx5.onrender.com
```

### Backend (`appsettings.Development.json`)
```json
{
  "FrontendOrigin": "http://localhost:5173"
}
```

---

## Troubleshooting

### SignalR Connection Fails
- Check backend is running: `http://localhost:5000`
- Check CORS in backend (should allow frontend origin)
- Browser console: Look for WebSocket errors

### API Calls Fail
- Verify backend URL in `.env.local`
- Check CORS headers

### Room Not Found
- Ensure invite code is copied correctly (case-sensitive)
- Room expires if player count reaches 0 (future: TTL)

---

## Next Steps

1. **Database:** Replace `InMemoryRoomService` with `SqlRoomService` + EF Core
2. **Auth:** Add JWT token for player identification
3. **Game Logic:** Implement Codenames (or your game) rules
4. **Deploy:** Push backend to Render/Railway/Azure, frontend to Vercel/Netlify
5. **Mobile:** Consider React Native for mobile companion app

---

## Useful Commands

```bash
# Backend
dotnet new webapi -n BrandNewBackend
dotnet add package Microsoft.AspNetCore.SignalR
dotnet ef migrations add InitialCreate
dotnet ef database update

# Frontend
npm run lint
npm run build
npm run preview
```

