namespace MyGamesPortal.Backend.Contracts;

public sealed record RoomDetailsResponse(
    Guid RoomId,
    string GameKey,
    string InviteCode,
    DateTime CreatedAtUtc,
    IReadOnlyList<PlayerResponse> Players);
