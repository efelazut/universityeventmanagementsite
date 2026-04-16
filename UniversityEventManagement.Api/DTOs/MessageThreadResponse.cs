namespace UniversityEventManagement.Api.DTOs;

public class MessageThreadResponse : IEntityResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string ClubAvatarUrl { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string LastMessagePreview { get; set; } = string.Empty;
    public int UnreadCount { get; set; }
    public DateTime UpdatedAt { get; set; }
    public IReadOnlyList<MessageResponse> Messages { get; set; } = [];
}
