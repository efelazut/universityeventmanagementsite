namespace UniversityEventManagement.Api.DTOs;

public class UserProfileResponse : IEntityResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Faculty { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public string YearClass { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActiveMember { get; set; }
    public int? ClubId { get; set; }
    public string? ClubName { get; set; }
    public IReadOnlyList<ManagedClubSummaryResponse> ManagedClubs { get; set; } = [];
}
