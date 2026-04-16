namespace UniversityEventManagement.Api.Models;

public class Room
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public bool IsAvailable { get; set; }

    public ICollection<Event> Events { get; set; } = new List<Event>();
}
