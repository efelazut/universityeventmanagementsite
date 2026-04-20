namespace UniversityEventManagement.Api.DTOs;

public class RoomDayAvailabilityResponse : IEntityResponse
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool HasAvailability { get; set; }
    public IReadOnlyList<RoomTimeSlotResponse> Slots { get; set; } = [];
}

public class RoomTimeSlotResponse
{
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public string Label { get; set; } = string.Empty;
}
