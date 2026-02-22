namespace MyGamesPortal.Backend.Contracts;

public sealed record PlayerResponse(Guid PlayerId, string Name, bool IsHost, DateTime JoinedAtUtc, string Team, string Role);
