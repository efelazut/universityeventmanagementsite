using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public class HomeService : IHomeService
{
    private readonly AppDbContext _dbContext;

    public HomeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public HomeFeedResponse GetFeed()
    {
        var now = DateTime.UtcNow;
        var events = _dbContext.Events
            .AsNoTracking()
            .Include(item => item.Club)
            .Include(item => item.Room)
            .Include(item => item.Registrations)
            .Include(item => item.Reviews)
            .ToList();

        var clubs = _dbContext.Clubs
            .AsNoTracking()
            .Include(item => item.Events)
                .ThenInclude(item => item.Reviews)
            .Include(item => item.Memberships)
            .ToList();

        var eventResponses = events.Select(EventService.MapEventResponse).ToList();
        var clubResponses = clubs.Select(ClubService.MapClubResponse).ToList();

        return new HomeFeedResponse
        {
            PopularEvents = eventResponses
                .OrderByDescending(item => item.RegistrationCount + item.ReviewCount * 3 + item.ActualAttendanceCount)
                .Take(4)
                .ToList(),
            UpcomingEvents = eventResponses
                .Where(item => item.StartDate >= now)
                .OrderBy(item => item.StartDate)
                .Take(6)
                .ToList(),
            OngoingEvents = eventResponses
                .Where(item => item.StartDate <= now && item.EndDate >= now)
                .OrderBy(item => item.StartDate)
                .ToList(),
            FeaturedClubs = clubResponses
                .OrderByDescending(item => item.AverageRating)
                .ThenByDescending(item => item.MemberCount)
                .Take(6)
                .ToList(),
            ActiveClubCount = clubs.Count(item => item.IsActive),
            UpcomingEventCount = events.Count(item => item.StartDate >= now),
            TotalParticipationCount = _dbContext.Registrations.Count(),
            ActiveStudentCount = _dbContext.Users.Count(item => item.Role == "Student" && item.IsActiveMember)
        };
    }
}
