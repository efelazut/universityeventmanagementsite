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
    public int? DeclaredMemberCount { get; set; }
    public int? ActualMemberCount { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public IReadOnlyDictionary<string, int> FacultyDistribution { get; set; } = new Dictionary<string, int>();
    public IReadOnlyDictionary<string, int> DepartmentDistribution { get; set; } = new Dictionary<string, int>();
}
