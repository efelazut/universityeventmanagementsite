using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:int}/reviews")]
public class EventReviewsController : ControllerBase
{
    private readonly IEventReviewService _eventReviewService;

    public EventReviewsController(IEventReviewService eventReviewService)
    {
        _eventReviewService = eventReviewService;
    }

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IReadOnlyList<EventReviewResponse>> GetByEventId(int eventId)
    {
        return Ok(_eventReviewService.GetByEventId(eventId));
    }

    [Authorize(Roles = "Student")]
    [HttpPost]
    public ActionResult<EventReviewResponse> Create(int eventId, [FromBody] EventReviewRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_eventReviewService.Create(eventId, currentUserId, userRole, request));
    }
}
