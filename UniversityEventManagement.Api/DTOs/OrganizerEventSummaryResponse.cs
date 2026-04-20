namespace UniversityEventManagement.Api.DTOs;

public class OrganizerEventSummaryResponse : IEntityResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}
