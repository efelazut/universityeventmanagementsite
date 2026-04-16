namespace UniversityEventManagement.Api.Models;

public class Club
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public string ShowcaseSummary { get; set; } = string.Empty;
    public string HighlightTitle { get; set; } = string.Empty;
    public string PresidentName { get; set; } = string.Empty;
    public string PresidentEmail { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<User> Members { get; set; } = new List<User>();
    public ICollection<ClubMembership> Memberships { get; set; } = new List<ClubMembership>();
    public ICollection<MessageThread> MessageThreads { get; set; } = new List<MessageThread>();
}
