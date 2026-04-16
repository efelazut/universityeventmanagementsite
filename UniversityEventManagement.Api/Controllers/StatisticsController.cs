using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("dashboard")]
    public ActionResult<DashboardStatisticsResponse> GetDashboard()
    {
        return Ok(_statisticsService.GetDashboard());
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("clubs")]
    public ActionResult<IReadOnlyList<ClubStatisticsItemResponse>> GetClubs()
    {
        return Ok(_statisticsService.GetClubStatistics());
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("events")]
    public ActionResult<IReadOnlyList<EventStatisticsItemResponse>> GetEvents()
    {
        return Ok(_statisticsService.GetEventStatistics());
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("rooms")]
    public ActionResult<IReadOnlyList<RoomPopularityResponse>> GetRooms()
    {
        return Ok(_statisticsService.GetRoomStatistics());
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpGet("students")]
    public ActionResult<StudentStatisticsResponse> GetStudents()
    {
        return Ok(_statisticsService.GetStudentStatistics());
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<PersonalStatisticsResponse> GetMyStatistics()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        return string.IsNullOrWhiteSpace(email)
            ? Unauthorized()
            : this.ToActionResult(_statisticsService.GetPersonalStatistics(email));
    }
}
