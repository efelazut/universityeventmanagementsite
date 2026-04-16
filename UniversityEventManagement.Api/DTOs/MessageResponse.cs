namespace UniversityEventManagement.Api.DTOs;

public class MessageResponse : IEntityResponse
{
    public int Id { get; set; }
    public int ThreadId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsUnreadForCurrentUser { get; set; }
}
