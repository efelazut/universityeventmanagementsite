namespace UniversityEventManagement.Api.DTOs;

public class ManagedClubSummaryResponse
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
