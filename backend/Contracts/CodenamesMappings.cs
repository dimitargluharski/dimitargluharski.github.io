using MyGamesPortal.Backend.Domain;

namespace MyGamesPortal.Backend.Contracts;

public static class CodenamesMappings
{
    public static CodenamesGameResponse ToResponse(this CodenamersGame game, bool revealKey)
    {
        lock (game.SyncRoot)
        {
            var cards = game.Cards
                .Select(card => new CodenamesCardResponse(
                    card.Word,
                    card.IsRevealed,
                    revealKey || card.IsRevealed ? card.Team : null))
                .ToList();

            var result = game.Result == null
                ? null
                : new CodenamesResultResponse(game.Result.WinnerTeam, game.Result.Reason, game.Result.EndReason);

            return new CodenamesGameResponse(
                game.RoomId,
                game.StartingTeam,
                game.CurrentTeam,
                game.Phase,
                game.CurrentClue,
                game.CurrentClueNumber,
                game.GuessesRemaining,
                game.RedCardsRemaining,
                game.BlueCardsRemaining,
                cards,
                result,
                game.CreatedAt,
                game.EndedAt);
        }
    }
}
