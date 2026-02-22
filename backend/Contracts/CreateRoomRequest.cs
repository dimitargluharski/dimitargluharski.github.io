namespace MyGamesPortal.Backend.Contracts;

public sealed record CreateRoomRequest(string GameKey, string? HostName);
