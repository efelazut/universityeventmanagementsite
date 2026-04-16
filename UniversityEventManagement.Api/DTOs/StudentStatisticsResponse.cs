namespace UniversityEventManagement.Api.DTOs;

public class StudentStatisticsResponse
{
    public int TotalStudentCount { get; set; }
    public IReadOnlyDictionary<string, int> FacultyDistribution { get; set; } = new Dictionary<string, int>();
    public IReadOnlyDictionary<string, int> DepartmentDistribution { get; set; } = new Dictionary<string, int>();
    public int ActiveMemberCount { get; set; }
}
