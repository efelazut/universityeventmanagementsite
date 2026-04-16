using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private static readonly InMemoryEntityStore<Event> Store = InMemoryDataStore.Events;
    private static readonly InMemoryEntityStore<Room> RoomsStore = InMemoryDataStore.Rooms;
    private static readonly InMemoryEntityStore<Club> ClubsStore = InMemoryDataStore.Clubs;

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<Event>> GetAll()
    {
        return Ok(Store.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<Event> GetById(int id)
    {
        var @event = Store.GetById(id);
        if (@event is null)
        {
            return NotFound();
        }

        return Ok(@event);
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost]
    public IActionResult Create([FromBody] Event @event)
    {
        if (@event is null)
        {
            return BadRequest();
        }

        var room = RoomsStore.GetById(@event.RoomId);
        if (room is null)
        {
            return NotFound("Room not found");
        }

        var club = ClubsStore.GetById(@event.ClubId);
        if (club is null)
        {
            return NotFound("Club not found");
        }

        var roomConflict = Store.GetAll().Any(existingEvent =>
            existingEvent.RoomId == @event.RoomId &&
            existingEvent.DateTime == @event.DateTime);

        if (roomConflict)
        {
            return BadRequest("Room is already booked for this time");
        }

        var createdEvent = Store.Create(new Event
        {
            Title = @event.Title,
            Description = @event.Description,
            DateTime = @event.DateTime,
            Capacity = @event.Capacity,
            ClubId = @event.ClubId,
            RoomId = @event.RoomId
        });

        return CreatedAtAction(nameof(GetById), new { id = createdEvent.Id }, createdEvent);
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Event @event)
    {
        if (@event is null)
        {
            return BadRequest();
        }

        if (@event.Id != 0 && @event.Id != id)
        {
            return BadRequest();
        }

        var room = RoomsStore.GetById(@event.RoomId);
        if (room is null)
        {
            return NotFound("Room not found");
        }

        var club = ClubsStore.GetById(@event.ClubId);
        if (club is null)
        {
            return NotFound("Club not found");
        }

        var roomConflict = Store.GetAll().Any(existingEvent =>
            existingEvent.Id != id &&
            existingEvent.RoomId == @event.RoomId &&
            existingEvent.DateTime == @event.DateTime);

        if (roomConflict)
        {
            return BadRequest("Room is already booked for this time");
        }

        var updatedEvent = new Event
        {
            Id = id,
            Title = @event.Title,
            Description = @event.Description,
            DateTime = @event.DateTime,
            Capacity = @event.Capacity,
            ClubId = @event.ClubId,
            RoomId = @event.RoomId
        };

        return Store.Update(id, updatedEvent) ? Ok(updatedEvent) : NotFound();
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return Store.Delete(id) ? Ok() : NotFound();
    }
}
