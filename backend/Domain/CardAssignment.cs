namespace MyGamesPortal.Backend.Domain;

public sealed class CardAssignment
{
    public required List<Card> Cards { get; init; }
    public required bool StartsWithRed { get; init; }

    private static readonly string[] WordList =
    [
        // Bulgarian Codenames vocabulary - 100+ words for variety
        "РЕКА", "МОРЕ", "ГОРА", "ПЛАНИНА", "ГРАД",
        "ЗАМЪК", "КЛАДЕНЕЦ", "МОСТ", "ПЪТ", "ПОЛЕТ",
        "ЗВЕЗДА", "ЛУНА", "СЛЪНЦЕ", "ОБЛАК", "ВЯТЪР",
        "ВОДА", "ЛЕД", "ОГЪН", "ЗЕМЯ", "КАМЪК",
        "ДЪРВО", "ЦВЕТЯ", "ТРЕВA", "ПТИЦА", "РИБА",
        "КОШКА", "КУЧЕ", "ЛЪВСКИ", "ТИГЪР", "МЕЧКА",
        "СОБОР", "КРАЙНЯ", "КНИГА", "ПИСМО", "ЛИСТ",
        "ДНЕВНИК", "ИСТОРИЯ", "ВОЙНА", "МИР", "СПРАВЕДЛИВОСТ",
        "ЛЮБОВ", "НЕНАВИСТ", "НАДЕЖДА", "ОТЧАЯНИЕ", "СТРАХ",
        "СМЕЛОСТ", "ВЕРНОСТ", "ПРЕДАТЕЛСТВО", "ДОСТОЙНСТВО", "ЧЕСТЬ",
        "ЩАСТИЕ", "ПЕЧАЛ", "ГНЕВ", "УСМИВКА", "СМЕХ",
        "ЖАЛОСТ", "ГОРДОСТ", "СМИРЕНИЕ", "ЗАВИСТ", "БЛАГОДАРНОСТ",
        "РАБОТА", "ОТДИХ", "ТАНЦ", "ПЕЕНЕ", "МУЗИКА",
        "ЖИВОПИС", "РЕЗБА", "ТЕАТЪР", "КИНО", "ЛИТЕРАТУРА",
        "НАУКА", "ФИЛОСОФИЯ", "МАТЕМАТИКА", "ФИЗИКА", "ХИМИЯ",
        "БИОЛОГИЯ", "ГЕОГРАФИЯ", "ИСТОРИЯ", "АСТРОНОМИЯ", "ГЕОЛОГИЯ",
        "АЛХИМИЯ", "МАГИЯ", "ТАЙНА", "МИСТЕРИЯ", "ЧУДО",
        "СКАЗКА", "ЛЕГЕНДА", "МИТ", "БАСН", "ПАРИТКА",
        "ВЪЗРАСТНОСТ", "МЛАДОСТ", "ДЕТСТВО", "СТАРОСТ", "СМЪРТ",
        "РАЖДАНЕ", "КРЕЩАНЕ", "СВАТБА", "ВЕНЧАН", "РАЗВОД",
        "СЕМЕЙСТВО", "КЛАН", "ИМПЕРИЯ", "ЦАРСТВО", "КНЯЖЕСТВО",
        "ГЕРЦОГСТВО", "ГРАФСТВО", "БАРОНСТВО", "СВОБОДА", "РОБСТВО",
        "КРАЙЕЧНИНА", "СЕЛИЩЕ", "ХУТОР", "ЗЕМЯ", "ВЛАДЕТЕЛСТВО"
    ];

    public static CardAssignment Generate()
    {
        var random = Random.Shared;
        
        // Select 25 random words
        var selectedWords = WordList
            .OrderBy(_ => random.Next())
            .Take(25)
            .ToList();

        // Assign teams
        var cards = new List<Card>();
        var startsWithRed = random.Next(2) == 0; // 50% chance
        
        // 9-8 split (one team gets 9, the other 8)
        var redCount = startsWithRed ? 9 : 8;
        var blueCount = startsWithRed ? 8 : 9;
        var neutralCount = 7;

        var teamAssignments = new List<CardTeam>();
        
        // Add red cards
        for (int i = 0; i < redCount; i++)
            teamAssignments.Add(CardTeam.Red);
        
        // Add blue cards
        for (int i = 0; i < blueCount; i++)
            teamAssignments.Add(CardTeam.Blue);
        
        // Add neutral cards
        for (int i = 0; i < neutralCount; i++)
            teamAssignments.Add(CardTeam.Neutral);
        
        // Add assassin
        teamAssignments.Add(CardTeam.Assassin);

        // Shuffle team assignments
        for (int i = teamAssignments.Count - 1; i > 0; i--)
        {
            int randomIndex = random.Next(i + 1);
            (teamAssignments[i], teamAssignments[randomIndex]) = (teamAssignments[randomIndex], teamAssignments[i]);
        }

        // Create cards
        for (int i = 0; i < 25; i++)
        {
            var card = new Card
            {
                Word = selectedWords[i],
                Team = teamAssignments[i],
                IsRevealed = false,
                IsAssassin = teamAssignments[i] == CardTeam.Assassin
            };
            cards.Add(card);
        }

        return new CardAssignment
        {
            Cards = cards,
            StartsWithRed = startsWithRed
        };
    }
}
