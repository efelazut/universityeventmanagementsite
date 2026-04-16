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
        return string.IsNullOrWhiteSpace(email)
            ? Unauthorized()
            : this.ToActionResult(_userService.GetCurrentUser(email));
    }

    [Authorize]
    [HttpGet("me/events")]
    public ActionResult<UserEventActivityResponse> GetCurrentUserEvents()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        return string.IsNullOrWhiteSpace(email)
            ? Unauthorized()
            : this.ToActionResult(_userService.GetCurrentUserEvents(email));
    }

    [HttpGet]
    public ActionResult<IEnumerable<UserResponse>> GetAll()
    {
        return Ok(_userService.GetAll());
    }

    [HttpGet("{id:int}")]
    public ActionResult<UserResponse> GetById(int id)
    {
        return this.ToActionResult(_userService.GetById(id));
    }

    [HttpPost]
    public ActionResult<UserResponse> Create([FromBody] UserRequest request)
    {
        return this.ToActionResult(_userService.Create(request), nameof(GetById));
    }

    [HttpPut("{id:int}")]
    public ActionResult<UserResponse> Update(int id, [FromBody] UserRequest request)
    {
        return this.ToActionResult(_userService.Update(id, request));
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return this.ToActionResult(_userService.Delete(id));
    }
}
