namespace UniversityEventManagement.Api.Models;

public class EventReview
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int UserId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Event? Event { get; set; }
    public User? User { get; set; }
}
