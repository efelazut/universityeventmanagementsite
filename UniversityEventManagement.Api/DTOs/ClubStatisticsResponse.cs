namespace UniversityEventManagement.Api.DTOs;

public class ClubStatisticsResponse
{
    public int ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public int ActiveMemberCount { get; set; }
    public int EventCount { get; set; }
    public int TotalRegistrations { get; set; }
    public int TotalAttendance { get; set; }
    public decimal TotalBudget { get; set; }
}
