namespace UniversityEventManagement.Api.DTOs;

public class ClubStatisticsItemResponse
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string PresidentName { get; set; } = string.Empty;
    public int EventCount { get; set; }
    public int ActiveMemberCount { get; set; }
}
