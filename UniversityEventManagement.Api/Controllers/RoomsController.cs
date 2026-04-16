using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private static readonly InMemoryEntityStore<Room> Store = InMemoryDataStore.Rooms;

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<Room>> GetAll()
    {
        return Ok(Store.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<Room> GetById(int id)
    {
        var room = Store.GetById(id);
        if (room is null)
        {
            return NotFound();
        }

        return Ok(room);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public IActionResult Create([FromBody] Room room)
    {
        if (room is null)
        {
            return BadRequest();
        }

        var createdRoom = Store.Create(new Room
        {
            Name = room.Name,
            Capacity = room.Capacity,
            Location = room.Location
        });

        return CreatedAtAction(nameof(GetById), new { id = createdRoom.Id }, createdRoom);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Room room)
    {
        if (room is null)
        {
            return BadRequest();
        }

        if (room.Id != 0 && room.Id != id)
        {
            return BadRequest();
        }

        var updatedRoom = new Room
        {
            Id = id,
            Name = room.Name,
            Capacity = room.Capacity,
            Location = room.Location
        };

        return Store.Update(id, updatedRoom) ? Ok(updatedRoom) : NotFound();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return Store.Delete(id) ? Ok() : NotFound();
    }
}
