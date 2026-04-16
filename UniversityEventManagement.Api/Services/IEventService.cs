using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IEventService
{
    IReadOnlyList<EventResponse> GetAll();
    ServiceResult<EventResponse> GetById(int id);
    ServiceResult<EventResponse> Create(EventRequest request, int currentUserId, string currentUserRole);
    ServiceResult<EventResponse> Update(int id, EventRequest request, int currentUserId, string currentUserRole);
    ServiceResult Delete(int id, int currentUserId, string currentUserRole);
    IReadOnlyList<EventResponse> GetPast();
    IReadOnlyList<EventResponse> GetUpcoming();
    ServiceResult<IReadOnlyList<RegistrationResponse>> GetRegistrations(int id);
    ServiceResult<AttendanceResponse> MarkAttendance(int eventId, int userId);
}
