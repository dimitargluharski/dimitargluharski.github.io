namespace MyGamesPortal.Backend.Domain;

public sealed class Room
{
    public required Guid Id { get; init; }
    public required string GameKey { get; init; }
    public required string InviteCode { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public List<Player> Players { get; } = [];
    public object SyncRoot { get; } = new();
}
