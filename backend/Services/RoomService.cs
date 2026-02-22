using MyGamesPortal.Backend.Domain;

namespace MyGamesPortal.Backend.Services;

public interface IRoomService
{
    Room CreateRoom(string gameKey);
    Room? GetRoomByInviteCode(string inviteCode);
    Room? GetRoomById(Guid roomId);
    Player? JoinRoom(Guid roomId, string playerName);
    bool RemovePlayerFromRoom(Guid roomId, Guid playerId);
}

public sealed class InMemoryRoomService : IRoomService
{
    private readonly Dictionary<string, Room> _roomsByInviteCode = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<Guid, Room> _roomsById = new();
    private readonly object _syncRoot = new();

    public Room CreateRoom(string gameKey)
    {
        var roomId = Guid.NewGuid();
        var inviteCode = GenerateInviteCode();
        var room = new Room
        {
            Id = roomId,
            GameKey = gameKey,
            InviteCode = inviteCode,
            CreatedAtUtc = DateTime.UtcNow
        };

        lock (_syncRoot)
        {
            _roomsByInviteCode[inviteCode] = room;
            _roomsById[roomId] = room;
        }

        return room;
    }

    public Room? GetRoomByInviteCode(string inviteCode)
    {
        lock (_syncRoot)
        {
            return _roomsByInviteCode.TryGetValue(inviteCode, out var room) ? room : null;
        }
    }

    public Room? GetRoomById(Guid roomId)
    {
        lock (_syncRoot)
        {
            return _roomsById.TryGetValue(roomId, out var room) ? room : null;
        }
    }

    public Player? JoinRoom(Guid roomId, string playerName)
    {
        lock (_syncRoot)
        {
            if (!_roomsById.TryGetValue(roomId, out var room))
            {
                return null;
            }

            lock (room.SyncRoot)
            {
                if (room.Players.Any(p => p.Name == playerName))
                {
                    return null; // Duplicate name
                }

                var player = new Player
                {
                    Id = Guid.NewGuid(),
                    Name = playerName,
                    IsHost = room.Players.Count == 0,
                    JoinedAtUtc = DateTime.UtcNow
                };

                room.Players.Add(player);
                return player;
            }
        }
    }

    public bool RemovePlayerFromRoom(Guid roomId, Guid playerId)
    {
        lock (_syncRoot)
        {
            if (!_roomsById.TryGetValue(roomId, out var room))
            {
                return false;
            }

            lock (room.SyncRoot)
            {
                var player = room.Players.FirstOrDefault(p => p.Id == playerId);
                if (player == null)
                {
                    return false;
                }

                room.Players.Remove(player);
                return true;
            }
        }
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 8)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }
}
