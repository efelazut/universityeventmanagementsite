namespace UniversityEventManagement.Api.Models;

public class ClubStatistic
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public int TotalMembers { get; set; }
    public string FacultyDistributionJson { get; set; } = "{}";
    public string DepartmentDistributionJson { get; set; } = "{}";

    public Club? Club { get; set; }
}
