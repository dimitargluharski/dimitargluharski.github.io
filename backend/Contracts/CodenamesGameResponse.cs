using MyGamesPortal.Backend.Domain;

namespace MyGamesPortal.Backend.Contracts;

public sealed record CodenamesCardResponse(
    string Word,
    bool IsRevealed,
    CardTeam? Team);

public sealed record CodenamesResultResponse(
    CardTeam WinnerTeam,
    string Reason,
    EndReason EndReason);

public sealed record CodenamesGameResponse(
    Guid RoomId,
    CardTeam StartingTeam,
    CardTeam CurrentTeam,
    GamePhase Phase,
    string? CurrentClue,
    int CurrentClueNumber,
    int GuessesRemaining,
    int RedCardsRemaining,
    int BlueCardsRemaining,
    IReadOnlyList<CodenamesCardResponse> Cards,
    CodenamesResultResponse? Result,
    DateTime CreatedAt,
    DateTime? EndedAt);

public sealed record GuessWordResponse(
    GuessResult GuessResult,
    CodenamesGameResponse Game);
