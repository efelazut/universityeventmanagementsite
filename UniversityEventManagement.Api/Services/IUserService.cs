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
    ServiceResult<UserProfileResponse> GetCurrentUser(string email);
    ServiceResult<UserEventActivityResponse> GetCurrentUserEvents(string email);
}
