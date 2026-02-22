using MyGamesPortal.Backend.Domain;

namespace MyGamesPortal.Backend.Contracts;

public static class RoomMappings
{
    public static RoomDetailsResponse ToResponse(this Room room)
    {
        lock (room.SyncRoot)
        {
            var players = room.Players
                .Select(player => new PlayerResponse(
                    player.Id,
                    player.Name,
                    player.IsHost,
                    player.JoinedAtUtc,
                    player.Team.ToString(),
                    player.Role.ToString()))
                .ToList();

            return new RoomDetailsResponse(
                room.Id,
                room.GameKey,
                room.InviteCode,
                room.CreatedAtUtc,
                players);
        }
    }
}
