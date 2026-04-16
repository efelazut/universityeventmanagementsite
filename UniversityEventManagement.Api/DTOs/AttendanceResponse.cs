namespace UniversityEventManagement.Api.DTOs;

public class AttendanceResponse
{
    public int EventId { get; set; }
    public int UserId { get; set; }
    public bool Attended { get; set; }
    public int ActualAttendanceCount { get; set; }
}
