using Microsoft.AspNetCore.Mvc;
using MyGamesPortal.Backend.Contracts;
using MyGamesPortal.Backend.Services;

namespace MyGamesPortal.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RoomsController(IRoomService roomService, IConfiguration configuration) : ControllerBase
{
    [HttpPost]
    public IActionResult CreateRoom([FromBody] CreateRoomRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GameKey))
        {
            return BadRequest(new { error = "GameKey is required" });
        }

        var room = roomService.CreateRoom(request.GameKey);
        var hostPlayer = request.HostName != null
            ? roomService.JoinRoom(room.Id, request.HostName)
            : null;

        var baseUrl = configuration["BaseUrl"] ?? "http://localhost:5000";
        var inviteUrl = $"{baseUrl}/join/{room.InviteCode}";

        var response = new CreateRoomResponse(
            room.Id,
            room.GameKey,
            room.InviteCode,
            inviteUrl,
            room.ToResponse());

        return CreatedAtAction(nameof(GetRoom), new { roomId = room.Id }, response);
    }

    [HttpGet("{roomId:guid}")]
    public IActionResult GetRoom(Guid roomId)
    {
        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return NotFound();
        }

        return Ok(room.ToResponse());
    }

    [HttpGet("by-invite/{inviteCode}")]
    public IActionResult GetRoomByInviteCode(string inviteCode)
    {
        var room = roomService.GetRoomByInviteCode(inviteCode);
        if (room == null)
        {
            return NotFound(new { error = "Invalid invite code" });
        }

        return Ok(room.ToResponse());
    }

    [HttpPost("{roomId:guid}/join")]
    public IActionResult JoinRoom(Guid roomId, [FromBody] JoinRoomRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PlayerName))
        {
            return BadRequest(new { error = "PlayerName is required" });
        }

        var player = roomService.JoinRoom(roomId, request.PlayerName);
        if (player == null)
        {
            return BadRequest(new { error = "Failed to join room (duplicate name or room not found)" });
        }

        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return NotFound();
        }

        var playerResponse = new PlayerResponse(
            player.Id,
            player.Name,
            player.IsHost,
            player.JoinedAtUtc,
            player.Team.ToString(),
            player.Role.ToString());

        return Ok(new { player = playerResponse, room = room.ToResponse() });
    }

    [HttpPost("{roomId:guid}/players/{playerId:guid}/assignment")]
    public IActionResult UpdateAssignment(Guid roomId, Guid playerId, [FromBody] UpdatePlayerAssignmentRequest request)
    {
        if (!Enum.TryParse<TeamPreference>(request.Team, true, out var teamPreference))
        {
            return BadRequest(new { error = "Invalid team. Use Random, Red or Blue." });
        }

        if (!Enum.TryParse<RolePreference>(request.Role, true, out var rolePreference))
        {
            return BadRequest(new { error = "Invalid role. Use Operative, Spymaster or Tester." });
        }

        var player = roomService.UpdatePlayerAssignment(roomId, playerId, teamPreference, rolePreference);
        if (player == null)
        {
            return NotFound(new { error = "Room or player not found." });
        }

        var room = roomService.GetRoomById(roomId);
        if (room == null)
        {
            return NotFound(new { error = "Room not found." });
        }

        var playerResponse = new PlayerResponse(
            player.Id,
            player.Name,
            player.IsHost,
            player.JoinedAtUtc,
            player.Team.ToString(),
            player.Role.ToString());

        return Ok(new { player = playerResponse, room = room.ToResponse() });
    }

    [HttpPost("{roomId:guid}/randomize")]
    public IActionResult RandomizeAssignments(Guid roomId)
    {
        var room = roomService.RandomizeAssignments(roomId);
        if (room == null)
        {
            return NotFound(new { error = "Room not found." });
        }

        return Ok(new { room = room.ToResponse() });
    }
}
