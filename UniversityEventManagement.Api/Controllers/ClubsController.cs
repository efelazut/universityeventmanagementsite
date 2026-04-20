using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClubsController : ControllerBase
{
    private readonly IClubService _clubService;

    public ClubsController(IClubService clubService)
    {
        _clubService = clubService;
    }

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<ClubResponse>> GetAll()
    {
        return Ok(_clubService.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<ClubResponse> GetById(int id)
    {
        return this.ToActionResult(_clubService.GetById(id));
    }

    [HttpPost]
    public ActionResult<ClubResponse> Create([FromBody] ClubRequest request)
    {
        return this.ToActionResult(_clubService.Create(request), nameof(GetById));
    }

    [HttpPut("{id:int}")]
    public ActionResult<ClubResponse> Update(int id, [FromBody] ClubRequest request)
    {
        return this.ToActionResult(_clubService.Update(id, request));
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (!int.TryParse(userIdClaim, out var currentUserId) || string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        var result = _clubService.Delete(id, currentUserId, role);
        return result.Status switch
        {
            ServiceResultStatus.Ok => NoContent(),
            ServiceResultStatus.BadRequest => BadRequest(result.Message),
            ServiceResultStatus.NotFound => NotFound(result.Message),
            ServiceResultStatus.Conflict => Conflict(result.Message),
            ServiceResultStatus.Unauthorized => Unauthorized(result.Message),
            ServiceResultStatus.Forbidden => Forbid(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    [AllowAnonymous]
    [HttpGet("{id:int}/members")]
    public ActionResult<IReadOnlyList<ClubMembershipResponse>> GetMembers(int id)
    {
        return this.ToActionResult(_clubService.GetMembers(id));
    }

    [AllowAnonymous]
    [HttpGet("{id:int}/events")]
    public ActionResult<IReadOnlyList<EventResponse>> GetEvents(int id)
    {
        var result = _clubService.GetEvents(id);
        return result.Status == ServiceResultStatus.Ok && result.Data is not null
            ? Ok(result.Data.Select(SanitizeEvent).ToList())
            : this.ToActionResult(result);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}/statistics")]
    public ActionResult<ClubStatisticsResponse> GetStatistics(int id)
    {
        return this.ToActionResult(_clubService.GetStatistics(id));
    }

    [Authorize]
    [HttpPost("{id:int}/join")]
    public ActionResult<ClubMembershipResponse> Join(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var currentUserId)
            ? this.ToActionResult(_clubService.Join(id, currentUserId))
            : Unauthorized();
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost("{id:int}/officers")]
    public ActionResult<ClubMembershipResponse> AssignOfficer(int id, [FromBody] ClubMembershipRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? this.ToActionResult(_clubService.AssignOfficer(id, request, currentUserId, role))
            : Unauthorized();
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpDelete("{id:int}/members/{membershipId:int}")]
    public IActionResult RemoveMembership(int id, int membershipId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);
        return int.TryParse(userIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(role)
            ? this.ToActionResult(_clubService.RemoveMembership(id, membershipId, currentUserId, role))
            : Unauthorized();
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost("{id:int}/president/{userId:int}")]
    public ActionResult<ClubResponse> AssignPresident(int id, int userId)
    {
        var currentUserIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

        return int.TryParse(currentUserIdClaim, out var currentUserId) && !string.IsNullOrWhiteSpace(currentUserRole)
            ? this.ToActionResult(_clubService.AssignPresident(id, userId, currentUserId, currentUserRole))
            : Unauthorized();
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
