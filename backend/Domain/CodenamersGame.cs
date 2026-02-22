namespace MyGamesPortal.Backend.Domain;

public sealed class CodenamersGame
{
    public required Guid Id { get; init; }
    public required Guid RoomId { get; init; }
    
    // Grid of 25 cards
    public List<Card> Cards { get; } = [];
    
    // Game state
    public CardTeam CurrentTeam { get; set; } = CardTeam.Red;
    public CardTeam StartingTeam { get; set; } = CardTeam.Red;
    public GamePhase Phase { get; set; } = GamePhase.SpymasterClue;
    
    // Score tracking
    public int RedCardsRemaining { get; set; } = 9; // Red starts with 9
    public int BlueCardsRemaining { get; set; } = 8;
    
    // Current turn state
    public string? CurrentClue { get; set; }
    public int CurrentClueNumber { get; set; }
    public int GuessesRemaining { get; set; }
    
    // Game result
    public GameResult? Result { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    
    // Thread-safe operations
    public object SyncRoot { get; } = new();

    public CodenamersGame()
    {
        Id = Guid.NewGuid();
    }

    public void Initialize()
    {
        lock (SyncRoot)
        {
            Cards.Clear();
            var assignment = CardAssignment.Generate();
            Cards.AddRange(assignment.Cards);
            StartingTeam = assignment.StartsWithRed ? CardTeam.Red : CardTeam.Blue;
            CurrentTeam = StartingTeam;
            RedCardsRemaining = assignment.StartsWithRed ? 9 : 8;
            BlueCardsRemaining = assignment.StartsWithRed ? 8 : 9;
            Phase = GamePhase.SpymasterClue;
            CurrentClue = null;
            CurrentClueNumber = 0;
            GuessesRemaining = 0;
            Result = null;
            EndedAt = null;
        }
    }

    public GuessResult ProcessGuess(string word)
    {
        lock (SyncRoot)
        {
            if (Result != null || Phase != GamePhase.TeamGuessing || GuessesRemaining <= 0)
            {
                return GuessResult.InvalidPhase;
            }

            // Find the card
            var card = Cards.FirstOrDefault(c => c.Word.Equals(word, StringComparison.OrdinalIgnoreCase));
            if (card == null)
                return GuessResult.NotFound;

            if (card.IsRevealed)
                return GuessResult.AlreadyRevealed;

            // Reveal the card
            card.IsRevealed = true;

            // Check if it's the assassin
            if (card.IsAssassin)
            {
                Result = new GameResult
                {
                    WinnerTeam = CurrentTeam == CardTeam.Red ? CardTeam.Blue : CardTeam.Red,
                    Reason = "Assassin revealed",
                    EndReason = EndReason.AssassinRevealed
                };
                Phase = GamePhase.GameOver;
                EndedAt = DateTime.UtcNow;
                return GuessResult.Assassin;
            }

            // Check if it matches current team
            if (card.Team == CurrentTeam)
            {
                // Correct guess
                if (CurrentTeam == CardTeam.Red)
                    RedCardsRemaining--;
                else
                    BlueCardsRemaining--;

                // Check for win
                if (RedCardsRemaining == 0)
                {
                    Result = new GameResult
                    {
                        WinnerTeam = CardTeam.Red,
                        Reason = "All red cards revealed",
                        EndReason = EndReason.AllCardsRevealed
                    };
                    Phase = GamePhase.GameOver;
                    EndedAt = DateTime.UtcNow;
                    return GuessResult.CorrectTeam;
                }

                if (BlueCardsRemaining == 0)
                {
                    Result = new GameResult
                    {
                        WinnerTeam = CardTeam.Blue,
                        Reason = "All blue cards revealed",
                        EndReason = EndReason.AllCardsRevealed
                    };
                    Phase = GamePhase.GameOver;
                    EndedAt = DateTime.UtcNow;
                    return GuessResult.CorrectTeam;
                }

                // Decrease guesses remaining
                GuessesRemaining--;

                // If guesses = 0, end turn
                if (GuessesRemaining == 0)
                {
                    EndTurn();
                    return GuessResult.CorrectTeamTurnEnds;
                }

                return GuessResult.CorrectTeam;
            }

            // Wrong team
            if (card.Team == CardTeam.Neutral)
            {
                EndTurn();
                return GuessResult.Neutral;
            }

            // Enemy team
            var enemyTeam = CurrentTeam == CardTeam.Red ? CardTeam.Blue : CardTeam.Red;
            if (card.Team == enemyTeam)
            {
                if (enemyTeam == CardTeam.Red)
                    RedCardsRemaining--;
                else
                    BlueCardsRemaining--;

                // Check for win
                if (RedCardsRemaining == 0)
                {
                    Result = new GameResult
                    {
                        WinnerTeam = CardTeam.Red,
                        Reason = "All red cards revealed",
                        EndReason = EndReason.AllCardsRevealed
                    };
                    Phase = GamePhase.GameOver;
                    EndedAt = DateTime.UtcNow;
                }

                if (BlueCardsRemaining == 0)
                {
                    Result = new GameResult
                    {
                        WinnerTeam = CardTeam.Blue,
                        Reason = "All blue cards revealed",
                        EndReason = EndReason.AllCardsRevealed
                    };
                    Phase = GamePhase.GameOver;
                    EndedAt = DateTime.UtcNow;
                }

                if (Result == null)
                {
                    EndTurn();
                }

                return GuessResult.EnemyTeam;
            }

            return GuessResult.Unknown;
        }
    }

    public void SetClue(string clue, int number)
    {
        lock (SyncRoot)
        {
            if (Result != null || Phase != GamePhase.SpymasterClue)
            {
                throw new InvalidOperationException("Cannot set a clue in the current game phase.");
            }

            if (string.IsNullOrWhiteSpace(clue))
            {
                throw new ArgumentException("Clue is required.", nameof(clue));
            }

            if (number < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(number), "Clue number must be at least 1.");
            }

            CurrentClue = clue;
            CurrentClueNumber = number;
            GuessesRemaining = number + 1; // +1 for the extra guess rule
            Phase = GamePhase.TeamGuessing;
        }
    }

    public void EndTurn()
    {
        lock (SyncRoot)
        {
            CurrentTeam = CurrentTeam == CardTeam.Red ? CardTeam.Blue : CardTeam.Red;
            Phase = GamePhase.SpymasterClue;
            CurrentClue = null;
            CurrentClueNumber = 0;
            GuessesRemaining = 0;
        }
    }
}

public enum GamePhase
{
    SpymasterClue,
    TeamGuessing,
    GameOver
}

public enum GuessResult
{
    InvalidPhase,
    NotFound,
    AlreadyRevealed,
    CorrectTeam,
    CorrectTeamTurnEnds,
    Neutral,
    EnemyTeam,
    Assassin,
    Unknown
}

public sealed class GameResult
{
    public required CardTeam WinnerTeam { get; init; }
    public required string Reason { get; init; }
    public required EndReason EndReason { get; init; }
}

public enum EndReason
{
    AllCardsRevealed,
    AssassinRevealed
}
