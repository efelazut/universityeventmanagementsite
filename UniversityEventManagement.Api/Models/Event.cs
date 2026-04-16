namespace UniversityEventManagement.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public int Capacity { get; set; }
    public int ClubId { get; set; }
    public int RoomId { get; set; }

    public Club? Club { get; set; }
    public Room? Room { get; set; }
    public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
}
