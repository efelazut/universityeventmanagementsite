namespace UniversityEventManagement.Api.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? ClubId { get; set; }
    public IReadOnlyList<ManagedClubSummaryResponse> ManagedClubs { get; set; } = [];
    public string Message { get; set; } = string.Empty;
}
