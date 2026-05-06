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
        var clubRatings = clubResponses.ToDictionary(item => item.Id, item => item.AverageRating);
        var featuredEvents = eventResponses
            .Where(item => item.ComputedStatus == "Upcoming" || item.ComputedStatus == "Ongoing")
            .OrderByDescending(item => item.ComputedStatus == "Ongoing")
            .ThenByDescending(item => item.StartDate)
            .ThenByDescending(item => item.AverageRating * 6
                + item.ReviewCount * 2
                + item.RegistrationCount * 1.4
                + item.ActualAttendanceCount
                + (item.ClubId.HasValue && clubRatings.TryGetValue(item.ClubId.Value, out var clubRating) ? clubRating * 3 : 0))
            .Take(4)
            .ToList();

        if (featuredEvents.Count < 4)
        {
            var fallbackEvents = eventResponses
                .Where(item => !featuredEvents.Any(selected => selected.Id == item.Id))
                .OrderByDescending(item => item.AverageRating * 5
                    + item.ReviewCount * 2
                    + item.RegistrationCount
                    + (item.ClubId.HasValue && clubRatings.TryGetValue(item.ClubId.Value, out var clubRating) ? clubRating * 3 : 0))
                .ThenByDescending(item => item.StartDate)
                .Take(4 - featuredEvents.Count)
                .ToList();

            featuredEvents.AddRange(fallbackEvents);
        }

        return new HomeFeedResponse
        {
            PopularEvents = featuredEvents,
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
