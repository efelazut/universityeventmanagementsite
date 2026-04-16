using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<EventResponse>> GetAll()
    {
        return Ok(_eventService.GetAll().Select(SanitizeEvent));
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<EventResponse> GetById(int id)
    {
        var result = _eventService.GetById(id);
        return result.Status == ServiceResultStatus.Ok && result.Data is not null
            ? Ok(SanitizeEvent(result.Data))
            : this.ToActionResult(result);
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost]
    public ActionResult<EventResponse> Create([FromBody] EventRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_eventService.Create(request, currentUserId, userRole), nameof(GetById));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPut("{id:int}")]
    public ActionResult<EventResponse> Update(int id, [FromBody] EventRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_eventService.Update(id, request, currentUserId, userRole));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_eventService.Delete(id, currentUserId, userRole));
    }

    [AllowAnonymous]
    [HttpGet("past")]
    public ActionResult<IEnumerable<EventResponse>> GetPast()
    {
        return Ok(_eventService.GetPast().Select(SanitizeEvent));
    }

    [AllowAnonymous]
    [HttpGet("upcoming")]
    public ActionResult<IEnumerable<EventResponse>> GetUpcoming()
    {
        return Ok(_eventService.GetUpcoming().Select(SanitizeEvent));
    }

    [AllowAnonymous]
    [HttpGet("{id:int}/registrations")]
    public ActionResult<IReadOnlyList<RegistrationResponse>> GetRegistrations(int id)
    {
        return this.ToActionResult(_eventService.GetRegistrations(id));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost("{id:int}/attendance/{userId:int}")]
    public ActionResult<AttendanceResponse> MarkAttendance(int id, int userId)
    {
        return this.ToActionResult(_eventService.MarkAttendance(id, userId));
    }

    private EventResponse SanitizeEvent(EventResponse response)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var canSeeCosts = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "ClubManager", StringComparison.OrdinalIgnoreCase);

        if (canSeeCosts)
        {
            return response;
        }

        response.PosterCost = 0;
        response.CateringCost = 0;
        response.SpeakerFee = 0;
        response.TotalCost = 0;
        return response;
    }
}
