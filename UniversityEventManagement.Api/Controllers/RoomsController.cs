using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<RoomResponse>> GetAll()
    {
        return Ok(_roomService.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<RoomResponse> GetById(int id)
    {
        return this.ToActionResult(_roomService.GetById(id));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public ActionResult<RoomResponse> Create([FromBody] RoomRequest request)
    {
        return this.ToActionResult(_roomService.Create(request), nameof(GetById));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public ActionResult<RoomResponse> Update(int id, [FromBody] RoomRequest request)
    {
        return this.ToActionResult(_roomService.Update(id, request));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return this.ToActionResult(_roomService.Delete(id));
    }

    [AllowAnonymous]
    [HttpGet("availability")]
    public ActionResult<IEnumerable<RoomAvailabilityResponse>> GetAvailability()
    {
        return Ok(_roomService.GetAvailability());
    }

    [AllowAnonymous]
    [HttpGet("popularity")]
    public ActionResult<IEnumerable<RoomPopularityResponse>> GetPopularity()
    {
        return Ok(_roomService.GetPopularity());
    }
}
