namespace UniversityEventManagement.Api.DTOs;

public class RoomAvailabilityResponse
{
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public DateTime? NextOccupiedStartDate { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
    public string? NextEventTitle { get; set; }
}
