using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IStatisticsService
{
    DashboardStatisticsResponse GetDashboard();
    IReadOnlyList<ClubStatisticsItemResponse> GetClubStatistics();
    IReadOnlyList<EventStatisticsItemResponse> GetEventStatistics();
    IReadOnlyList<RoomPopularityResponse> GetRoomStatistics();
    StudentStatisticsResponse GetStudentStatistics();
    ImportStatusResponse GetImportStatus();
    Task<ServiceResult<ImportStatusResponse>> ReseedImportAsync();
    ServiceResult<PersonalStatisticsResponse> GetPersonalStatistics(string email);
}
