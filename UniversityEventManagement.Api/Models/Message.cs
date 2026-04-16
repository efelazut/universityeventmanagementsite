namespace UniversityEventManagement.Api.Models;

public class Message
{
    public int Id { get; set; }
    public int ThreadId { get; set; }
    public int SenderUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public MessageThread? Thread { get; set; }
    public User? SenderUser { get; set; }
}
