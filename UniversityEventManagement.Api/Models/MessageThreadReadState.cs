namespace UniversityEventManagement.Api.Models;

public class MessageThreadReadState
{
    public int Id { get; set; }
    public int ThreadId { get; set; }
    public int UserId { get; set; }
    public DateTime? LastReadAt { get; set; }

    public MessageThread? Thread { get; set; }
    public User? User { get; set; }
}
