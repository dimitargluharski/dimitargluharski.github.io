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

    public async Task<bool> UpdatePlayerAssignment(Guid roomId, Guid playerId, string team, string role)
    {
        if (!Enum.TryParse<TeamPreference>(team, true, out var teamPreference))
        {
            return false;
        }

        if (!Enum.TryParse<RolePreference>(role, true, out var rolePreference))
        {
            return false;
        }

        var player = roomService.UpdatePlayerAssignment(roomId, playerId, teamPreference, rolePreference);
        if (player == null)
        {
            return false;
        }

        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return false;
        }

        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerAssignmentUpdated", new { playerId, room = room.ToResponse() });

        return true;
    }

    public async Task<bool> RandomizeAssignments(Guid roomId)
    {
        var room = roomService.RandomizeAssignments(roomId);
        if (room == null)
        {
            return false;
        }

        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerAssignmentUpdated", new { playerId = Guid.Empty, room = room.ToResponse() });

        return true;
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

    public async Task UpdateWordHover(Guid roomId, Guid playerId, string? word)
    {
        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerWordHoverUpdated", new { playerId, word });
    }

    public async Task UpdateWordSelection(Guid roomId, Guid playerId, string word, bool isSelected)
    {
        await Clients.Group($"room:{roomId}")
            .SendAsync("PlayerWordSelectionUpdated", new { playerId, word, isSelected });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Future: Track player disconnect and clean up if needed
        await base.OnDisconnectedAsync(exception);
    }
}
