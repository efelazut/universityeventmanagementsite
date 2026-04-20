using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IUserService
{
    IReadOnlyList<UserResponse> GetAll();
    ServiceResult<UserResponse> GetById(int id);
    ServiceResult<UserResponse> Create(UserRequest request);
    ServiceResult<UserResponse> Update(int id, UserRequest request);
    ServiceResult Delete(int id);
    IReadOnlyList<UserResponse> GetByClubId(int clubId);
    ServiceResult<UserProfileResponse> GetCurrentUser(int? userId, string? email);
    ServiceResult<UserEventActivityResponse> GetCurrentUserEvents(int? userId, string? email);
    ServiceResult<OrganizerProfileResponse> GetOrganizerProfile(int id);
}
