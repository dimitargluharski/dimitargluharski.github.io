using MyGamesPortal.Backend.Domain;
using MyGamesPortal.Backend.Contracts;

namespace MyGamesPortal.Backend.Services;

public interface IRoomService
{
    Room CreateRoom(string gameKey);
    Room? GetRoomByInviteCode(string inviteCode);
    Room? GetRoomById(Guid roomId);
    Player? JoinRoom(Guid roomId, string playerName);
    Player? UpdatePlayerAssignment(Guid roomId, Guid playerId, TeamPreference teamPreference, RolePreference rolePreference);
    Room? RandomizeAssignments(Guid roomId);
    bool HasRequiredSpymasters(Guid roomId, out string? reason);
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
                    JoinedAtUtc = DateTime.UtcNow,
                    Team = GetBalancedRandomTeam(room.Players),
                    Role = PlayerRole.Operative
                };

                room.Players.Add(player);
                return player;
            }
        }
    }

    public Player? UpdatePlayerAssignment(Guid roomId, Guid playerId, TeamPreference teamPreference, RolePreference rolePreference)
    {
        lock (_syncRoot)
        {
            if (!_roomsById.TryGetValue(roomId, out var room))
            {
                return null;
            }

            lock (room.SyncRoot)
            {
                var player = room.Players.FirstOrDefault(p => p.Id == playerId);
                if (player == null)
                {
                    return null;
                }

                player.Team = teamPreference switch
                {
                    TeamPreference.Red => Team.Red,
                    TeamPreference.Blue => Team.Blue,
                    _ => GetBalancedRandomTeam(room.Players.Where(p => p.Id != playerId))
                };

                player.Role = rolePreference switch
                {
                    RolePreference.Spymaster => PlayerRole.Spymaster,
                    RolePreference.Tester => PlayerRole.Tester,
                    _ => PlayerRole.Operative
                };

                return player;
            }
        }
    }

    public Room? RandomizeAssignments(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (!_roomsById.TryGetValue(roomId, out var room))
            {
                return null;
            }

            lock (room.SyncRoot)
            {
                if (room.Players.Count == 0)
                {
                    return room;
                }

                var players = room.Players
                    .OrderBy(_ => Random.Shared.Next())
                    .ToList();

                var startTeam = Random.Shared.Next(2) == 0 ? Team.Red : Team.Blue;
                for (var index = 0; index < players.Count; index++)
                {
                    players[index].Team = (index % 2 == 0)
                        ? startTeam
                        : (startTeam == Team.Red ? Team.Blue : Team.Red);
                    players[index].Role = PlayerRole.Operative;
                }

                var redCandidates = players.Where(player => player.Team == Team.Red).ToList();
                var blueCandidates = players.Where(player => player.Team == Team.Blue).ToList();

                if (redCandidates.Count > 0)
                {
                    redCandidates[Random.Shared.Next(redCandidates.Count)].Role = PlayerRole.Spymaster;
                }

                if (blueCandidates.Count > 0)
                {
                    blueCandidates[Random.Shared.Next(blueCandidates.Count)].Role = PlayerRole.Spymaster;
                }

                if (players.All(player => player.Role != PlayerRole.Spymaster))
                {
                    players[Random.Shared.Next(players.Count)].Role = PlayerRole.Spymaster;
                }

                return room;
            }
        }
    }

    public bool HasRequiredSpymasters(Guid roomId, out string? reason)
    {
        lock (_syncRoot)
        {
            if (!_roomsById.TryGetValue(roomId, out var room))
            {
                reason = "Room not found.";
                return false;
            }

            lock (room.SyncRoot)
            {
                var hasRedSpymaster = room.Players.Any(p => p.Team == Team.Red && p.Role == PlayerRole.Spymaster);
                var hasBlueSpymaster = room.Players.Any(p => p.Team == Team.Blue && p.Role == PlayerRole.Spymaster);

                if (!hasRedSpymaster || !hasBlueSpymaster)
                {
                    reason = "Трябва да има поне 1 обясняващ (Spymaster) за Червени и Сини.";
                    return false;
                }

                reason = null;
                return true;
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

    private static Team GetBalancedRandomTeam(IEnumerable<Player> players)
    {
        var list = players.ToList();
        var redCount = list.Count(player => player.Team == Team.Red);
        var blueCount = list.Count(player => player.Team == Team.Blue);

        if (redCount < blueCount)
        {
            return Team.Red;
        }

        if (blueCount < redCount)
        {
            return Team.Blue;
        }

        return Random.Shared.Next(2) == 0 ? Team.Red : Team.Blue;
    }
}
