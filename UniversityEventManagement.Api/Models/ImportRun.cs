namespace UniversityEventManagement.Api.Models;

public class ImportRun
{
    public int Id { get; set; }
    public DateTime ImportedAt { get; set; }
    public string Source { get; set; } = string.Empty;
    public int ClubCount { get; set; }
    public int EventCount { get; set; }
    public int RoomCount { get; set; }
    public int ClubStatisticCount { get; set; }
    public int WarningCount { get; set; }
    public string WarningSummaryJson { get; set; } = "[]";
}
