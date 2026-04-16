using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IHomeService
{
    HomeFeedResponse GetFeed();
}
