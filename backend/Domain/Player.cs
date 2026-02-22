namespace MyGamesPortal.Backend.Domain;

public sealed class Player
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required bool IsHost { get; init; }
    public required DateTime JoinedAtUtc { get; init; }
}
