namespace UniversityEventManagement.Api.Models;

public class Club
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public ICollection<Event> Events { get; set; } = new List<Event>();
}
