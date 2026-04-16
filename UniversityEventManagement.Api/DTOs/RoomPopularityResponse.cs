namespace UniversityEventManagement.Api.DTOs;

public class RoomPopularityResponse
{
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int EventCount { get; set; }
}
