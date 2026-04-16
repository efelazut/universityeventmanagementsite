using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public ActionResult<IReadOnlyList<NotificationResponse>> GetMine()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var currentUserId)
            ? Ok(_notificationService.GetForUser(currentUserId))
            : Unauthorized();
    }

    [HttpPost("{id:int}/read")]
    public IActionResult MarkAsRead(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var currentUserId)
            ? this.ToActionResult(_notificationService.MarkAsRead(id, currentUserId))
            : Unauthorized();
    }

    [HttpPost("read-all")]
    public IActionResult MarkAllAsRead()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var currentUserId)
            ? this.ToActionResult(_notificationService.MarkAllAsRead(currentUserId))
            : Unauthorized();
    }
}
