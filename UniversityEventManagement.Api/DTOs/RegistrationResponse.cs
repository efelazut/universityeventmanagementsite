namespace UniversityEventManagement.Api.DTOs;

public class RegistrationResponse : IEntityResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int EventId { get; set; }
    public DateTime RegisteredAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool Attended { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string EventTitle { get; set; } = string.Empty;
}
