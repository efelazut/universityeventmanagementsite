using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IRegistrationService
{
    IReadOnlyList<RegistrationResponse> GetAll();
    ServiceResult<RegistrationResponse> GetById(int id);
    ServiceResult<RegistrationResponse> Create(RegistrationRequest request, int currentUserId, string currentUserRole);
    ServiceResult<RegistrationResponse> Update(int id, RegistrationRequest request);
    ServiceResult Delete(int id);
    ServiceResult CancelForUser(int eventId, int currentUserId, string currentUserRole);
    IReadOnlyList<RegistrationResponse> GetByEventId(int eventId);
    ServiceResult<RegistrationResponse> Decide(int registrationId, string decision, int currentUserId, string currentUserRole);
}
