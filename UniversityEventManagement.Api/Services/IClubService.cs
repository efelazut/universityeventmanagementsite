using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IClubService
{
    IReadOnlyList<ClubResponse> GetAll();
    ServiceResult<ClubResponse> GetById(int id);
    ServiceResult<ClubResponse> Create(ClubRequest request);
    ServiceResult<ClubResponse> Update(int id, ClubRequest request);
    ServiceResult Delete(int id);
    ServiceResult<IReadOnlyList<ClubMembershipResponse>> GetMembers(int id);
    ServiceResult<IReadOnlyList<EventResponse>> GetEvents(int id);
    ServiceResult<ClubStatisticsResponse> GetStatistics(int id);
    ServiceResult<ClubMembershipResponse> Join(int clubId, int currentUserId);
    ServiceResult<ClubMembershipResponse> AssignOfficer(int clubId, ClubMembershipRequest request, int currentUserId, string currentUserRole);
    ServiceResult RemoveMembership(int clubId, int membershipId, int currentUserId, string currentUserRole);
    ServiceResult<ClubResponse> AssignPresident(int clubId, int userId);
}
