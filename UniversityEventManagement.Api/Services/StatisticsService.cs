using System.Text.Json;
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
        var events = _dbContext.Events.AsNoTracking().ToList();
        var registrations = _dbContext.Registrations.AsNoTracking().ToList();
        var reviews = _dbContext.EventReviews.AsNoTracking().ToList();
        var totalAnonymousMembers = _dbContext.ClubStatistics.AsNoTracking().Sum(item => item.TotalMembers);
        var now = DateTime.UtcNow;

        return new DashboardStatisticsResponse
        {
            TotalStudents = totalAnonymousMembers,
            ActiveMemberCount = totalAnonymousMembers,
            ClubCount = clubs.Count,
            EventCount = events.Count,
            PastEventCount = events.Count(@event => @event.EndDate < now || @event.IsPastEvent),
            UpcomingEventCount = events.Count(@event => @event.StartDate >= now && !@event.IsPastEvent),
            TotalRegistrations = registrations.Count,
            TotalAttendance = events.Sum(@event => @event.ParticipantCount ?? @event.ActualAttendanceCount),
            AverageEventCost = events.Count == 0 ? 0 : events.Average(@event => @event.PosterCost + @event.CateringCost + @event.SpeakerFee),
            AverageRating = reviews.Count == 0 ? 0 : reviews.Average(review => review.Rating),
            ClubPresidents = clubs.Select(club => $"{club.Name} - {club.PresidentName}").ToList()
        };
    }

    public IReadOnlyList<ClubStatisticsItemResponse> GetClubStatistics()
    {
        var eventCounts = _dbContext.Events.AsNoTracking()
            .Where(@event => @event.ClubId.HasValue)
            .GroupBy(@event => @event.ClubId!.Value)
            .ToDictionary(group => group.Key, group => group.Count());

        var memberCounts = _dbContext.ClubStatistics.AsNoTracking()
            .GroupBy(item => item.ClubId)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(item => item.AcademicYear).First());

        return _dbContext.Clubs.AsNoTracking()
            .ToList()
            .Select(club =>
            {
                memberCounts.TryGetValue(club.Id, out var statistic);
                return new ClubStatisticsItemResponse
                {
                    ClubId = club.Id,
                    ClubName = club.Name,
                    PresidentName = club.PresidentName,
                    EventCount = eventCounts.TryGetValue(club.Id, out var eventCount) ? eventCount : 0,
                    ActiveMemberCount = statistic?.TotalMembers ?? club.ActualMemberCount ?? club.DeclaredMemberCount ?? 0,
                    ActualMemberCount = club.ActualMemberCount,
                    AcademicYear = statistic?.AcademicYear ?? club.AcademicYear
                };
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
                ActualAttendanceCount = @event.ParticipantCount ?? @event.ActualAttendanceCount,
                TotalCost = @event.PosterCost + @event.CateringCost + @event.SpeakerFee,
                IsPast = @event.EndDate < now || @event.IsPastEvent,
                FillRate = @event.Capacity == 0 ? 0 : (double)(@event.ParticipantCount ?? @event.Registrations.Count) / @event.Capacity * 100,
                AverageRating = @event.Reviews.Count == 0 ? 0 : @event.Reviews.Average(review => review.Rating)
            })
            .OrderByDescending(item => item.IsPast)
            .ThenBy(item => item.Title)
            .ToList();
    }

    public IReadOnlyList<RoomPopularityResponse> GetRoomStatistics()
    {
        var eventCounts = _dbContext.Events.AsNoTracking()
            .Where(@event => @event.RoomId.HasValue)
            .GroupBy(@event => @event.RoomId!.Value)
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
        var statistics = _dbContext.ClubStatistics.AsNoTracking().ToList();

        return new StudentStatisticsResponse
        {
            TotalStudentCount = statistics.Sum(item => item.TotalMembers),
            ActiveMemberCount = statistics.Sum(item => item.TotalMembers),
            FacultyDistribution = MergeJsonDistributions(statistics.Select(item => item.FacultyDistributionJson)),
            DepartmentDistribution = MergeJsonDistributions(statistics.Select(item => item.DepartmentDistributionJson))
        };
    }

    public ImportStatusResponse GetImportStatus()
    {
        var lastRun = _dbContext.ImportRuns.AsNoTracking().OrderByDescending(item => item.ImportedAt).FirstOrDefault();
        return new ImportStatusResponse
        {
            TotalClubs = _dbContext.Clubs.Count(),
            TotalEvents = _dbContext.Events.Count(),
            TotalRooms = _dbContext.Rooms.Count(),
            TotalClubStatistics = _dbContext.ClubStatistics.Count(),
            WarningCount = lastRun?.WarningCount ?? 0,
            LastImportedAt = lastRun?.ImportedAt,
            Source = lastRun?.Source ?? string.Empty,
            Warnings = string.IsNullOrWhiteSpace(lastRun?.WarningSummaryJson)
                ? []
                : JsonSerializer.Deserialize<List<string>>(lastRun.WarningSummaryJson) ?? []
        };
    }

    public async Task<ServiceResult<ImportStatusResponse>> ReseedImportAsync()
    {
        await AppDbSeeder.ReseedAsync(_dbContext);
        return ServiceResult<ImportStatusResponse>.Ok(GetImportStatus());
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

    private static Dictionary<string, int> MergeJsonDistributions(IEnumerable<string> payloads)
    {
        var result = new Dictionary<string, int>();
        foreach (var payload in payloads)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                continue;
            }

            var values = JsonSerializer.Deserialize<Dictionary<string, int>>(payload) ?? [];
            foreach (var (key, count) in values)
            {
                result[key] = result.TryGetValue(key, out var existing) ? existing + count : count;
            }
        }

        return result.OrderBy(item => item.Key).ToDictionary(item => item.Key, item => item.Value);
    }
}
