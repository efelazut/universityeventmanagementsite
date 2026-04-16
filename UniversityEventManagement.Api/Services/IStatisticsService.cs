using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IStatisticsService
{
    DashboardStatisticsResponse GetDashboard();
    IReadOnlyList<ClubStatisticsItemResponse> GetClubStatistics();
    IReadOnlyList<EventStatisticsItemResponse> GetEventStatistics();
    IReadOnlyList<RoomPopularityResponse> GetRoomStatistics();
    StudentStatisticsResponse GetStudentStatistics();
    ServiceResult<PersonalStatisticsResponse> GetPersonalStatistics(string email);
}
