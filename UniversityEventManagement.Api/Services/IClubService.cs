using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IClubService
{
    IReadOnlyList<ClubResponse> GetAll();
    ServiceResult<ClubResponse> GetById(int id);
    ServiceResult<ClubResponse> Create(ClubRequest request);
    ServiceResult<ClubResponse> Update(int id, ClubRequest request);
    ServiceResult Delete(int id, int currentUserId, string currentUserRole);
    ServiceResult<IReadOnlyList<EventResponse>> GetEvents(int id);
    ServiceResult<ClubStatisticsResponse> GetStatistics(int id);
    ServiceResult<IReadOnlyList<ClubManagerResponse>> GetManagers(int id);
    ServiceResult<ClubFollowStatusResponse> GetFollowStatus(int clubId, int currentUserId);
    ServiceResult<ClubFollowStatusResponse> Follow(int clubId, int currentUserId);
    ServiceResult<ClubFollowStatusResponse> Unfollow(int clubId, int currentUserId);
    ServiceResult<ClubManagerResponse> AddManager(int clubId, ClubManagerRequest request, int currentUserId, string currentUserRole);
    ServiceResult RemoveManager(int clubId, int managerId, int currentUserId, string currentUserRole);
}
