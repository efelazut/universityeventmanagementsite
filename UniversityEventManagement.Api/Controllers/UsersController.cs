using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private static readonly InMemoryEntityStore<User> Store = InMemoryDataStore.Users;

    [HttpGet]
    public ActionResult<IEnumerable<User>> GetAll()
    {
        return Ok(Store.GetAll());
    }

    [HttpGet("{id:int}")]
    public ActionResult<User> GetById(int id)
    {
        var user = Store.GetById(id);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost]
    public ActionResult<User> Create([FromBody] User user)
    {
        if (user is null ||
            string.IsNullOrWhiteSpace(user.Name) ||
            string.IsNullOrWhiteSpace(user.Email) ||
            string.IsNullOrWhiteSpace(user.Password) ||
            string.IsNullOrWhiteSpace(user.Role))
        {
            return BadRequest();
        }

        if (!UserRoles.IsSupported(user.Role))
        {
            return BadRequest("Invalid role");
        }

        var normalizedEmail = user.Email.Trim();
        var existingUser = Store.GetAll().FirstOrDefault(existingUser =>
            existingUser.Email.Equals(normalizedEmail, StringComparison.OrdinalIgnoreCase));

        if (existingUser is not null)
        {
            return Conflict("Email is already registered");
        }

        var createdUser = Store.Create(new User
        {
            Name = user.Name,
            Email = normalizedEmail,
            Password = user.Password,
            Role = UserRoles.Normalize(user.Role)
        });

        return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdUser);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] User user)
    {
        if (user is null ||
            string.IsNullOrWhiteSpace(user.Name) ||
            string.IsNullOrWhiteSpace(user.Email) ||
            string.IsNullOrWhiteSpace(user.Password) ||
            string.IsNullOrWhiteSpace(user.Role))
        {
            return BadRequest();
        }

        if (user.Id != 0 && user.Id != id)
        {
            return BadRequest();
        }

        if (!UserRoles.IsSupported(user.Role))
        {
            return BadRequest("Invalid role");
        }

        var normalizedEmail = user.Email.Trim();
        var duplicateEmail = Store.GetAll().Any(existingUser =>
            existingUser.Id != id &&
            existingUser.Email.Equals(normalizedEmail, StringComparison.OrdinalIgnoreCase));

        if (duplicateEmail)
        {
            return Conflict("Email is already registered");
        }

        var updatedUser = new User
        {
            Id = id,
            Name = user.Name,
            Email = normalizedEmail,
            Password = user.Password,
            Role = UserRoles.Normalize(user.Role)
        };

        return Store.Update(id, updatedUser) ? Ok(updatedUser) : NotFound();
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return Store.Delete(id) ? Ok() : NotFound();
    }
}
