using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClubsController : ControllerBase
{
    private static readonly InMemoryEntityStore<Club> Store = InMemoryDataStore.Clubs;

    [HttpGet]
    public ActionResult<IEnumerable<Club>> GetAll()
    {
        return Ok(Store.GetAll());
    }

    [HttpGet("{id:int}")]
    public ActionResult<Club> GetById(int id)
    {
        var club = Store.GetById(id);
        if (club is null)
        {
            return NotFound();
        }

        return Ok(club);
    }

    [HttpPost]
    public ActionResult<Club> Create([FromBody] Club club)
    {
        if (club is null)
        {
            return BadRequest();
        }

        var createdClub = Store.Create(new Club
        {
            Name = club.Name,
            Description = club.Description
        });

        return CreatedAtAction(nameof(GetById), new { id = createdClub.Id }, createdClub);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Club club)
    {
        if (club is null)
        {
            return BadRequest();
        }

        if (club.Id != 0 && club.Id != id)
        {
            return BadRequest();
        }

        var updatedClub = new Club
        {
            Id = id,
            Name = club.Name,
            Description = club.Description
        };

        return Store.Update(id, updatedClub) ? Ok(updatedClub) : NotFound();
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return Store.Delete(id) ? Ok() : NotFound();
    }
}
