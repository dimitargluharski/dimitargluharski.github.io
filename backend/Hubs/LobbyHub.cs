using Microsoft.AspNetCore.SignalR;
using MyGamesPortal.Backend.Contracts;
using MyGamesPortal.Backend.Services;

namespace MyGamesPortal.Backend.Hubs;

public sealed class LobbyHub(IRoomService roomService) : Hub
{
    public async Task JoinLobby(Guid roomId, Guid playerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room:{roomId}");
        
        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return;
        }

        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerJoined", new { playerId, room = room.ToResponse() });
    }

    public async Task LeaveLobby(Guid roomId, Guid playerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room:{roomId}");
        roomService.RemovePlayerFromRoom(roomId, playerId);

        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return;
        }

        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerLeft", new { playerId, room = room.ToResponse() });
    }

    public async Task SetPlayerReady(Guid roomId, Guid playerId, bool isReady)
    {
        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerReadyChanged", new { playerId, isReady });
    }

    public async Task StartGame(Guid roomId)
    {
        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return;
        }

        await Clients.Group($"room:{roomId}")
            .SendAsync("GameStarted", new { roomId, timestamp = DateTime.UtcNow });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Future: Track player disconnect and clean up if needed
        await base.OnDisconnectedAsync(exception);
    }
}
