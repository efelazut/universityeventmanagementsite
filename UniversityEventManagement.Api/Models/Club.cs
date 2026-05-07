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
    public string InstagramUrl { get; set; } = string.Empty;
    public int? MemberCapacity { get; set; }
    public int? DeclaredMemberCount { get; set; }
    public int? ActualMemberCount { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string SourceKey { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ICollection<Event> Events { get; set; } = new List<Event>();
    public ICollection<ClubFollower> Followers { get; set; } = new List<ClubFollower>();
    public ICollection<ClubManager> Managers { get; set; } = new List<ClubManager>();
    public ICollection<MessageThread> MessageThreads { get; set; } = new List<MessageThread>();
    public ICollection<ClubStatistic> Statistics { get; set; } = new List<ClubStatistic>();
}
