namespace UniversityEventManagement.Api.DTOs;

public class OrganizerProfileResponse : IEntityResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string PrimaryClubName { get; set; } = string.Empty;
    public string PrimaryClubCategory { get; set; } = string.Empty;
    public IReadOnlyList<string> ManagedClubNames { get; set; } = [];
    public int TotalEventCount { get; set; }
    public double AverageEventRating { get; set; }
    public int TotalReviewCount { get; set; }
    public IReadOnlyList<OrganizerEventSummaryResponse> Events { get; set; } = [];
}
