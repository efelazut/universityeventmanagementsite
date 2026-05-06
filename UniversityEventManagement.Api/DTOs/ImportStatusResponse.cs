namespace UniversityEventManagement.Api.DTOs;

public class ImportStatusResponse
{
    public int TotalClubs { get; set; }
    public int TotalEvents { get; set; }
    public int TotalRooms { get; set; }
    public int TotalClubStatistics { get; set; }
    public int WarningCount { get; set; }
    public DateTime? LastImportedAt { get; set; }
    public string Source { get; set; } = string.Empty;
    public IReadOnlyList<string> Warnings { get; set; } = [];
}
