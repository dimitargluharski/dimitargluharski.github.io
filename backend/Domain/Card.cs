namespace MyGamesPortal.Backend.Domain;

public sealed class Card
{
    public required string Word { get; init; }
    public required CardTeam Team { get; init; }
    public bool IsRevealed { get; set; }
    public bool IsAssassin { get; set; }

    public override string ToString() => $"{Word} ({Team}, Revealed: {IsRevealed})";
}

public enum CardTeam
{
    Red,
    Blue,
    Neutral,
    Assassin
}
