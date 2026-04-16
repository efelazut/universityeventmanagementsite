namespace UniversityEventManagement.Api.Models;

public class MessageThread
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int StudentId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Club? Club { get; set; }
    public User? Student { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<MessageThreadReadState> ReadStates { get; set; } = new List<MessageThreadReadState>();
}
