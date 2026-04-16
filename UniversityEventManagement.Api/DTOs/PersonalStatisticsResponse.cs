namespace UniversityEventManagement.Api.DTOs;

public class PersonalStatisticsResponse
{
    public int RegisteredEventCount { get; set; }
    public int AttendedEventCount { get; set; }
    public int UpcomingEventCount { get; set; }
    public int ReviewCount { get; set; }
    public double AverageRatingGiven { get; set; }
}
