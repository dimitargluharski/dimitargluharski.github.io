using MyGamesPortal.Backend.Domain;

namespace MyGamesPortal.Backend.Services;

public interface ICodenamesService
{
    CodenamersGame StartGame(Guid roomId);
    CodenamersGame? GetGame(Guid roomId);
    CodenamersGame SetClue(Guid roomId, string clue, int number);
    GuessResult GuessWord(Guid roomId, string word, out CodenamersGame game);
    CodenamersGame EndTurn(Guid roomId);
}

public sealed class InMemoryCodenamesService(IRoomService roomService) : ICodenamesService
{
    private readonly Dictionary<Guid, CodenamersGame> _gamesByRoomId = new();
    private readonly object _syncRoot = new();

    public CodenamersGame StartGame(Guid roomId)
    {
        lock (_syncRoot)
        {
            var room = roomService.GetRoomById(roomId);
            if (room == null)
            {
                throw new InvalidOperationException("Room not found.");
            }

            var game = new CodenamersGame
            {
                Id = Guid.NewGuid(),
                RoomId = roomId
            };

            game.Initialize();
            _gamesByRoomId[roomId] = game;
            return game;
        }
    }

    public CodenamersGame? GetGame(Guid roomId)
    {
        lock (_syncRoot)
        {
            return _gamesByRoomId.TryGetValue(roomId, out var game) ? game : null;
        }
    }

    public CodenamersGame SetClue(Guid roomId, string clue, int number)
    {
        lock (_syncRoot)
        {
            if (!_gamesByRoomId.TryGetValue(roomId, out var game))
            {
                throw new InvalidOperationException("Game not found for room.");
            }

            game.SetClue(clue, number);
            return game;
        }
    }

    public GuessResult GuessWord(Guid roomId, string word, out CodenamersGame game)
    {
        lock (_syncRoot)
        {
            if (!_gamesByRoomId.TryGetValue(roomId, out game!))
            {
                throw new InvalidOperationException("Game not found for room.");
            }

            return game.ProcessGuess(word);
        }
    }

    public CodenamersGame EndTurn(Guid roomId)
    {
        lock (_syncRoot)
        {
            if (!_gamesByRoomId.TryGetValue(roomId, out var game))
            {
                throw new InvalidOperationException("Game not found for room.");
            }

            game.EndTurn();
            return game;
        }
    }
}
