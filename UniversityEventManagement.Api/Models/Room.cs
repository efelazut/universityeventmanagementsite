namespace UniversityEventManagement.Api.Models;

public class Room
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;

    public ICollection<Event> Events { get; set; } = new List<Event>();
}
