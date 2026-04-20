using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IRoomService
{
    IReadOnlyList<RoomResponse> GetAll();
    ServiceResult<RoomResponse> GetById(int id);
    ServiceResult<RoomResponse> Create(RoomRequest request);
    ServiceResult<RoomResponse> Update(int id, RoomRequest request);
    ServiceResult Delete(int id);
    IReadOnlyList<RoomAvailabilityResponse> GetAvailability();
    IReadOnlyList<RoomPopularityResponse> GetPopularity();
    ServiceResult<RoomDayAvailabilityResponse> GetDayAvailability(int roomId, DateTime date);
}
