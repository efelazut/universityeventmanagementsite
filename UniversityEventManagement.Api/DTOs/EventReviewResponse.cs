namespace UniversityEventManagement.Api.DTOs;

public class EventReviewResponse : IEntityResponse
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
