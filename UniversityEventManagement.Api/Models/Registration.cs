namespace UniversityEventManagement.Api.Models;

public class Registration
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EventId { get; set; }
    public DateTime RegisteredAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool Attended { get; set; }

    public User? User { get; set; }
    public Event? Event { get; set; }
}
