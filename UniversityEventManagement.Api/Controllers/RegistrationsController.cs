using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationsController : ControllerBase
{
    private static readonly InMemoryEntityStore<Registration> Store = InMemoryDataStore.Registrations;
    private static readonly InMemoryEntityStore<Event> EventsStore = InMemoryDataStore.Events;
    private static readonly InMemoryEntityStore<User> UsersStore = InMemoryDataStore.Users;

    [AllowAnonymous]
    [HttpGet]
    public ActionResult<IEnumerable<Registration>> GetAll()
    {
        return Ok(Store.GetAll());
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public ActionResult<Registration> GetById(int id)
    {
        var registration = Store.GetById(id);
        if (registration is null)
        {
            return NotFound();
        }

        return Ok(registration);
    }

    [Authorize(Roles = "Student")]
    [HttpPost]
    public IActionResult Create([FromBody] Registration registration)
    {
        if (registration is null)
        {
            return BadRequest();
        }

        var @event = EventsStore.GetById(registration.EventId);
        if (@event is null)
        {
            return NotFound("Event not found");
        }

        var user = UsersStore.GetById(registration.UserId);
        if (user is null)
        {
            return NotFound("User not found");
        }

        var registrations = Store.GetAll();
        var duplicateRegistration = registrations.Any(existingRegistration =>
            existingRegistration.EventId == registration.EventId &&
            existingRegistration.UserId == registration.UserId);

        if (duplicateRegistration)
        {
            return BadRequest("User is already registered for this event");
        }

        var eventRegistrationCount = registrations.Count(existingRegistration =>
            existingRegistration.EventId == registration.EventId);

        if (eventRegistrationCount >= @event.Capacity)
        {
            return BadRequest("Event is full");
        }

        var createdRegistration = Store.Create(new Registration
        {
            UserId = registration.UserId,
            EventId = registration.EventId
        });

        return CreatedAtAction(nameof(GetById), new { id = createdRegistration.Id }, createdRegistration);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Registration registration)
    {
        if (registration is null)
        {
            return BadRequest();
        }

        if (registration.Id != 0 && registration.Id != id)
        {
            return BadRequest();
        }

        var updatedRegistration = new Registration
        {
            Id = id,
            UserId = registration.UserId,
            EventId = registration.EventId
        };

        return Store.Update(id, updatedRegistration) ? Ok(updatedRegistration) : NotFound();
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return Store.Delete(id) ? Ok() : NotFound();
    }
}
