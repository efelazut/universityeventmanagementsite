using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _dbContext;

    public StatisticsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public DashboardStatisticsResponse GetDashboard()
    {
        var clubs = _dbContext.Clubs.AsNoTracking().ToList();
        var students = _dbContext.Users.AsNoTracking().Where(user => user.Role == "Student").ToList();
        var events = _dbContext.Events.AsNoTracking().ToList();
        var registrations = _dbContext.Registrations.AsNoTracking().ToList();
        var reviews = _dbContext.EventReviews.AsNoTracking().ToList();
        var now = DateTime.UtcNow;

        return new DashboardStatisticsResponse
        {
            TotalStudents = students.Count,
            ActiveMemberCount = students.Count(user => user.IsActiveMember),
            ClubCount = clubs.Count,
            EventCount = events.Count,
            PastEventCount = events.Count(@event => @event.EndDate < now),
            UpcomingEventCount = events.Count(@event => @event.StartDate >= now),
            TotalRegistrations = registrations.Count,
            TotalAttendance = registrations.Count(registration => registration.Attended),
            AverageEventCost = events.Count == 0 ? 0 : events.Average(@event => @event.PosterCost + @event.CateringCost + @event.SpeakerFee),
            AverageRating = reviews.Count == 0 ? 0 : reviews.Average(review => review.Rating),
            ClubPresidents = clubs.Select(club => $"{club.Name} - {club.PresidentName}").ToList()
        };
    }

    public IReadOnlyList<ClubStatisticsItemResponse> GetClubStatistics()
    {
        var eventCounts = _dbContext.Events.AsNoTracking()
            .GroupBy(@event => @event.ClubId)
            .ToDictionary(group => group.Key, group => group.Count());

        var memberCounts = _dbContext.Users.AsNoTracking()
            .Where(user => user.IsActiveMember && user.ClubId.HasValue)
            .GroupBy(user => user.ClubId!.Value)
            .ToDictionary(group => group.Key, group => group.Count());

        return _dbContext.Clubs.AsNoTracking()
            .ToList()
            .Select(club => new ClubStatisticsItemResponse
            {
                ClubId = club.Id,
                ClubName = club.Name,
                PresidentName = club.PresidentName,
                EventCount = eventCounts.TryGetValue(club.Id, out var eventCount) ? eventCount : 0,
                ActiveMemberCount = memberCounts.TryGetValue(club.Id, out var memberCount) ? memberCount : 0
            })
            .OrderByDescending(item => item.EventCount)
            .ThenBy(item => item.ClubName)
            .ToList();
    }

    public IReadOnlyList<EventStatisticsItemResponse> GetEventStatistics()
    {
        var now = DateTime.UtcNow;
        return _dbContext.Events.AsNoTracking()
            .Include(@event => @event.Registrations)
            .Include(@event => @event.Reviews)
            .Select(@event => new EventStatisticsItemResponse
            {
                EventId = @event.Id,
                Title = @event.Title,
                Status = @event.Status,
                RegistrationCount = @event.Registrations.Count,
                ActualAttendanceCount = @event.ActualAttendanceCount,
                TotalCost = @event.PosterCost + @event.CateringCost + @event.SpeakerFee,
                IsPast = @event.EndDate < now,
                FillRate = @event.Capacity == 0 ? 0 : (double)@event.Registrations.Count / @event.Capacity * 100,
                AverageRating = @event.Reviews.Count == 0 ? 0 : @event.Reviews.Average(review => review.Rating)
            })
            .OrderByDescending(item => item.IsPast)
            .ThenBy(item => item.Title)
            .ToList();
    }

    public IReadOnlyList<RoomPopularityResponse> GetRoomStatistics()
    {
        var eventCounts = _dbContext.Events.AsNoTracking()
            .GroupBy(@event => @event.RoomId)
            .ToDictionary(group => group.Key, group => group.Count());

        return _dbContext.Rooms.AsNoTracking()
            .ToList()
            .Select(room => new RoomPopularityResponse
            {
                RoomId = room.Id,
                RoomName = room.Name,
                Building = room.Building,
                Capacity = room.Capacity,
                EventCount = eventCounts.TryGetValue(room.Id, out var count) ? count : 0
            })
            .OrderByDescending(item => item.EventCount)
            .ThenByDescending(item => item.Capacity)
            .ToList();
    }

    public StudentStatisticsResponse GetStudentStatistics()
    {
        var students = _dbContext.Users.AsNoTracking().Where(user => user.Role == "Student").ToList();

        return new StudentStatisticsResponse
        {
            TotalStudentCount = students.Count,
            ActiveMemberCount = students.Count(student => student.IsActiveMember),
            FacultyDistribution = students
                .GroupBy(student => student.Faculty)
                .OrderBy(group => group.Key)
                .ToDictionary(group => group.Key, group => group.Count()),
            DepartmentDistribution = students
                .GroupBy(student => student.Department)
                .OrderBy(group => group.Key)
                .ToDictionary(group => group.Key, group => group.Count())
        };
    }

    public ServiceResult<PersonalStatisticsResponse> GetPersonalStatistics(string email)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(item => item.Email.ToLower() == email.Trim().ToLower());

        if (user is null)
        {
            return ServiceResult<PersonalStatisticsResponse>.NotFound("Kullanici bulunamadi.");
        }

        var now = DateTime.UtcNow;
        var registrations = _dbContext.Registrations
            .AsNoTracking()
            .Include(item => item.Event)
            .Where(item => item.UserId == user.Id)
            .ToList();
        var reviews = _dbContext.EventReviews
            .AsNoTracking()
            .Where(item => item.UserId == user.Id)
            .ToList();

        return ServiceResult<PersonalStatisticsResponse>.Ok(new PersonalStatisticsResponse
        {
            RegisteredEventCount = registrations.Count,
            AttendedEventCount = registrations.Count(item => item.Attended),
            UpcomingEventCount = registrations.Count(item => item.Event is not null && item.Event.StartDate > now),
            ReviewCount = reviews.Count,
            AverageRatingGiven = reviews.Count == 0 ? 0 : reviews.Average(item => item.Rating)
        });
    }
}
