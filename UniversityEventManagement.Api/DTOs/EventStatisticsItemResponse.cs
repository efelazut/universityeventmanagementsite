namespace UniversityEventManagement.Api.DTOs;

public class EventStatisticsItemResponse
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int RegistrationCount { get; set; }
    public int ActualAttendanceCount { get; set; }
    public decimal TotalCost { get; set; }
    public bool IsPast { get; set; }
    public double FillRate { get; set; }
    public double AverageRating { get; set; }
}
