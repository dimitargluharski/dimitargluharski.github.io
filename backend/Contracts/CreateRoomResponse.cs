namespace MyGamesPortal.Backend.Contracts;

public sealed record CreateRoomResponse(
    Guid RoomId,
    string GameKey,
    string InviteCode,
    string InviteUrl,
    RoomDetailsResponse Room);
