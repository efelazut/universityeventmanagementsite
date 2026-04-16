using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpGet]
    public ActionResult<IReadOnlyList<MessageThreadResponse>> GetThreads()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? Ok(_messageService.GetThreads(currentUserId, role))
            : Unauthorized();
    }

    [HttpGet("{id:int}")]
    public ActionResult<MessageThreadResponse> GetThread(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? this.ToActionResult(_messageService.GetThread(id, currentUserId, role))
            : Unauthorized();
    }

    [HttpPost]
    public ActionResult<MessageThreadResponse> Create([FromBody] CreateMessageThreadRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? this.ToActionResult(_messageService.CreateThread(request, currentUserId, role))
            : Unauthorized();
    }

    [HttpPost("{id:int}/messages")]
    public ActionResult<MessageThreadResponse> Send(int id, [FromBody] SendMessageRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? this.ToActionResult(_messageService.SendMessage(id, request, currentUserId, role))
            : Unauthorized();
    }
}
