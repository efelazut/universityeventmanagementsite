using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private readonly IRegistrationService _registrationService;

    public RegistrationsController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<RegistrationResponse>> GetAll()
    {
        return Ok(_registrationService.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<RegistrationResponse> GetById(int id)
    {
        return this.ToActionResult(_registrationService.GetById(id));
    }

    [Authorize(Roles = "Student")]
    [HttpPost]
    public ActionResult<RegistrationResponse> Create([FromBody] RegistrationRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_registrationService.Create(request, currentUserId, userRole), nameof(GetById));
    }

    [HttpPut("{id:int}")]
    public ActionResult<RegistrationResponse> Update(int id, [FromBody] RegistrationRequest request)
    {
        return this.ToActionResult(_registrationService.Update(id, request));
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return this.ToActionResult(_registrationService.Delete(id));
    }

    [Authorize(Roles = "Student")]
    [HttpDelete("event/{eventId:int}/me")]
    public IActionResult CancelMyRegistration(int eventId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_registrationService.CancelForUser(eventId, currentUserId, userRole));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost("{id:int}/{decision}")]
    public ActionResult<RegistrationResponse> Decide(int id, string decision)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(userRole))
        {
            return Unauthorized();
        }

        return this.ToActionResult(_registrationService.Decide(id, decision, currentUserId, userRole));
    }
}
