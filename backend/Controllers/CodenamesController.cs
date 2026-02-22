using Microsoft.AspNetCore.Mvc;
using MyGamesPortal.Backend.Contracts;
using MyGamesPortal.Backend.Services;

namespace MyGamesPortal.Backend.Controllers;

[ApiController]
[Route("api/rooms/{roomId:guid}/codenames")]
public sealed class CodenamesController(ICodenamesService codenamesService) : ControllerBase
{
    [HttpPost("start")]
    public IActionResult StartGame(Guid roomId)
    {
        try
        {
            var game = codenamesService.StartGame(roomId);
            return Ok(game.ToResponse(revealKey: true));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    public IActionResult GetGame(Guid roomId, [FromQuery] bool revealKey = false)
    {
        var game = codenamesService.GetGame(roomId);
        if (game == null)
        {
            return NotFound(new { error = "Game not started" });
        }

        return Ok(game.ToResponse(revealKey));
    }

    [HttpPost("clue")]
    public IActionResult SetClue(Guid roomId, [FromBody] SetClueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Clue))
        {
            return BadRequest(new { error = "Clue is required." });
        }

        if (request.Number < 1)
        {
            return BadRequest(new { error = "Clue number must be at least 1." });
        }

        try
        {
            var game = codenamesService.SetClue(roomId, request.Clue.Trim(), request.Number);
            return Ok(game.ToResponse(revealKey: false));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("guess")]
    public IActionResult GuessWord(Guid roomId, [FromBody] GuessWordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Word))
        {
            return BadRequest(new { error = "Word is required." });
        }

        try
        {
            var result = codenamesService.GuessWord(roomId, request.Word.Trim(), out var game);
            return Ok(new GuessWordResponse(result, game.ToResponse(revealKey: false)));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("end-turn")]
    public IActionResult EndTurn(Guid roomId)
    {
        try
        {
            var game = codenamesService.EndTurn(roomId);
            return Ok(game.ToResponse(revealKey: false));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
