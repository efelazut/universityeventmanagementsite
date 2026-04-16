namespace UniversityEventManagement.Api.DTOs;

public class ClubResponse : IEntityResponse
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
    public int MemberCount { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public IReadOnlyList<string> RecentEventTitles { get; set; } = [];
}
