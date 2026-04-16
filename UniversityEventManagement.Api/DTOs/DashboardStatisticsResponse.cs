namespace UniversityEventManagement.Api.DTOs;

public class DashboardStatisticsResponse
{
    public int TotalStudents { get; set; }
    public int ActiveMemberCount { get; set; }
    public int ClubCount { get; set; }
    public int EventCount { get; set; }
    public int PastEventCount { get; set; }
    public int UpcomingEventCount { get; set; }
    public int TotalRegistrations { get; set; }
    public int TotalAttendance { get; set; }
    public decimal AverageEventCost { get; set; }
    public double AverageRating { get; set; }
    public IReadOnlyList<string> ClubPresidents { get; set; } = Array.Empty<string>();
}
