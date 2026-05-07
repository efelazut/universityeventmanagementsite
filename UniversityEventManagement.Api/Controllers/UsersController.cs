using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<UserProfileResponse> GetCurrentUser()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : (int?)null;
        return this.ToActionResult(_userService.GetCurrentUser(currentUserId, email));
    }

    [Authorize]
    [HttpPut("me")]
    public ActionResult<UserProfileResponse> UpdateCurrentUser([FromBody] UpdateCurrentUserRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : (int?)null;
        return this.ToActionResult(_userService.UpdateCurrentUser(currentUserId, email, request));
    }

    [Authorize]
    [HttpPut("me/academic-info")]
    public ActionResult<UserProfileResponse> UpdateCurrentUserAcademicInfo([FromBody] UpdateAcademicInfoRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : (int?)null;
        return this.ToActionResult(_userService.UpdateCurrentUserAcademicInfo(currentUserId, email, request));
    }

    [Authorize]
    [HttpPut("me/password")]
    public IActionResult ChangeCurrentUserPassword([FromBody] UpdatePasswordRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : (int?)null;
        return this.ToActionResult(_userService.ChangeCurrentUserPassword(currentUserId, email, request));
    }

    [Authorize]
    [HttpGet("me/events")]
    public ActionResult<UserEventActivityResponse> GetCurrentUserEvents()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserId = int.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : (int?)null;
        return this.ToActionResult(_userService.GetCurrentUserEvents(currentUserId, email));
    }

    [HttpGet("{id:int}/organizer-profile")]
    public ActionResult<OrganizerProfileResponse> GetOrganizerProfile(int id)
    {
        return this.ToActionResult(_userService.GetOrganizerProfile(id));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet]
    public ActionResult<IEnumerable<UserResponse>> GetAll()
    {
        return Ok(_userService.GetAll());
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("{id:int}")]
    public ActionResult<UserResponse> GetById(int id)
    {
        return this.ToActionResult(_userService.GetById(id));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public ActionResult<UserResponse> Create([FromBody] UserRequest request)
    {
        return this.ToActionResult(_userService.Create(request), nameof(GetById));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public ActionResult<UserResponse> Update(int id, [FromBody] UserRequest request)
    {
        return this.ToActionResult(_userService.Update(id, request));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return this.ToActionResult(_userService.Delete(id));
    }
}
