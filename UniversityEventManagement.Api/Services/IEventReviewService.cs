using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IEventReviewService
{
    IReadOnlyList<EventReviewResponse> GetByEventId(int eventId);
    ServiceResult<EventReviewResponse> Create(int eventId, int userId, string userRole, EventReviewRequest request);
}
