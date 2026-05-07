namespace UniversityEventManagement.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public string YearClass { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public bool IsActiveMember { get; set; }
    public int? ClubId { get; set; }

    public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
    public ICollection<EventReview> Reviews { get; set; } = new List<EventReview>();
    public ICollection<ClubFollower> FollowedClubs { get; set; } = new List<ClubFollower>();
    public ICollection<ClubManager> ManagedClubs { get; set; } = new List<ClubManager>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
    public ICollection<MessageThread> StudentMessageThreads { get; set; } = new List<MessageThread>();
    public ICollection<MessageThreadReadState> MessageThreadReadStates { get; set; } = new List<MessageThreadReadState>();
    public Club? Club { get; set; }
}
