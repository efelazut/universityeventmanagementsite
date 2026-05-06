namespace UniversityEventManagement.Api.DTOs;

public class UserEventActivityItemResponse : IEntityResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ClubId { get; set; }
    public int? RoomId { get; set; }
    public DateTime RegisteredAt { get; set; }
    public bool Attended { get; set; }
}
