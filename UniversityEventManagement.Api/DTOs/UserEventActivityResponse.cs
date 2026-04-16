namespace UniversityEventManagement.Api.DTOs;

public class UserEventActivityResponse
{
    public IReadOnlyList<UserEventActivityItemResponse> RegisteredEvents { get; set; } = [];
    public IReadOnlyList<UserEventActivityItemResponse> AttendedEvents { get; set; } = [];
    public IReadOnlyList<UserEventActivityItemResponse> UpcomingRegistrations { get; set; } = [];
}
