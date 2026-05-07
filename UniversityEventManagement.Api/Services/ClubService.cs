using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Services;

public class ClubService : IClubService
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public ClubService(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public IReadOnlyList<ClubResponse> GetAll() => QueryClubs()
        .ToList()
        .Select(MapClubResponse)
        .ToList();

    public ServiceResult<ClubResponse> GetById(int id)
    {
        var club = QueryClubs().FirstOrDefault(item => item.Id == id);
        return club is null
            ? ServiceResult<ClubResponse>.NotFound()
            : ServiceResult<ClubResponse>.Ok(MapClubResponse(club));
    }

    public ServiceResult<ClubResponse> Create(ClubRequest request)
    {
        var normalizedName = request.Name.Trim();
        if (_dbContext.Clubs.Any(club => club.Name.ToLower() == normalizedName.ToLower()))
        {
            return ServiceResult<ClubResponse>.Conflict("Club name already exists.");
        }

        var createdClub = new Club
        {
            Name = normalizedName,
            Description = request.Description?.Trim() ?? string.Empty,
            Category = request.Category?.Trim() ?? string.Empty,
            AvatarUrl = request.AvatarUrl?.Trim() ?? string.Empty,
            BannerUrl = request.BannerUrl?.Trim() ?? string.Empty,
            ShowcaseSummary = request.ShowcaseSummary?.Trim() ?? string.Empty,
            HighlightTitle = request.HighlightTitle?.Trim() ?? string.Empty,
            PresidentName = request.PresidentName.Trim(),
            PresidentEmail = request.PresidentEmail.Trim(),
            IsActive = request.IsActive
        };

        _dbContext.Clubs.Add(createdClub);
        _dbContext.SaveChanges();

        return ServiceResult<ClubResponse>.Created(MapClubResponse(QueryClubs().First(club => club.Id == createdClub.Id)));
    }

    public ServiceResult<ClubResponse> Update(int id, ClubRequest request)
    {
        var club = _dbContext.Clubs.FirstOrDefault(item => item.Id == id);
        if (club is null)
        {
            return ServiceResult<ClubResponse>.NotFound();
        }

        var normalizedName = request.Name.Trim();
        var duplicateName = _dbContext.Clubs
            .AsNoTracking()
            .Any(item => item.Id != id && item.Name.ToLower() == normalizedName.ToLower());

        if (duplicateName)
        {
            return ServiceResult<ClubResponse>.Conflict("Club name already exists.");
        }

        club.Name = normalizedName;
        club.Description = request.Description?.Trim() ?? string.Empty;
        club.Category = request.Category?.Trim() ?? string.Empty;
        club.AvatarUrl = request.AvatarUrl?.Trim() ?? string.Empty;
        club.BannerUrl = request.BannerUrl?.Trim() ?? string.Empty;
        club.ShowcaseSummary = request.ShowcaseSummary?.Trim() ?? string.Empty;
        club.HighlightTitle = request.HighlightTitle?.Trim() ?? string.Empty;
        club.PresidentName = request.PresidentName.Trim();
        club.PresidentEmail = request.PresidentEmail.Trim();
        club.IsActive = request.IsActive;

        _dbContext.SaveChanges();

        return ServiceResult<ClubResponse>.Ok(MapClubResponse(QueryClubs().First(item => item.Id == id)));
    }

    public ServiceResult Delete(int id, int currentUserId, string currentUserRole)
    {
        var club = _dbContext.Clubs.FirstOrDefault(item => item.Id == id);
        if (club is null)
        {
            return ServiceResult.NotFound();
        }

        if (!CanDeleteClub(id, currentUserId, currentUserRole))
        {
            return ServiceResult.Forbidden("Bu kulübü silme yetkiniz yok.");
        }

        var eventIds = _dbContext.Events
            .Where(@event => @event.ClubId == id)
            .Select(@event => @event.Id)
            .ToList();

        if (eventIds.Count != 0)
        {
            var registrations = _dbContext.Registrations.Where(registration => eventIds.Contains(registration.EventId)).ToList();
            var reviews = _dbContext.EventReviews.Where(review => eventIds.Contains(review.EventId)).ToList();

            if (registrations.Count != 0)
            {
                _dbContext.Registrations.RemoveRange(registrations);
            }

            if (reviews.Count != 0)
            {
                _dbContext.EventReviews.RemoveRange(reviews);
            }

            var events = _dbContext.Events.Where(@event => eventIds.Contains(@event.Id)).ToList();
            _dbContext.Events.RemoveRange(events);
        }

        var threadIds = _dbContext.MessageThreads
            .Where(thread => thread.ClubId == id)
            .Select(thread => thread.Id)
            .ToList();

        if (threadIds.Count != 0)
        {
            var readStates = _dbContext.MessageThreadReadStates.Where(state => threadIds.Contains(state.ThreadId)).ToList();
            var messages = _dbContext.Messages.Where(message => threadIds.Contains(message.ThreadId)).ToList();
            var threads = _dbContext.MessageThreads.Where(thread => threadIds.Contains(thread.Id)).ToList();

            if (readStates.Count != 0)
            {
                _dbContext.MessageThreadReadStates.RemoveRange(readStates);
            }

            if (messages.Count != 0)
            {
                _dbContext.Messages.RemoveRange(messages);
            }

            _dbContext.MessageThreads.RemoveRange(threads);
        }

        _dbContext.ClubFollowers.RemoveRange(_dbContext.ClubFollowers.Where(follower => follower.ClubId == id));
        _dbContext.ClubManagers.RemoveRange(_dbContext.ClubManagers.Where(manager => manager.ClubId == id));

        var linkedUsers = _dbContext.Users.Where(user => user.ClubId == id).ToList();
        foreach (var user in linkedUsers)
        {
            user.ClubId = null;
            if (string.Equals(user.Role, UserRoles.ClubManager, StringComparison.OrdinalIgnoreCase))
            {
                user.Role = UserRoles.Student;
            }
        }

        _dbContext.Clubs.Remove(club);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public ServiceResult<IReadOnlyList<EventResponse>> GetEvents(int id)
    {
        if (!_dbContext.Clubs.Any(club => club.Id == id))
        {
            return ServiceResult<IReadOnlyList<EventResponse>>.NotFound();
        }

        var events = _dbContext.Events
            .AsNoTracking()
            .Include(@event => @event.Club)
            .Include(@event => @event.Room)
            .Include(@event => @event.Registrations)
            .Include(@event => @event.Reviews)
            .Where(@event => @event.ClubId == id)
            .OrderByDescending(@event => @event.StartDate)
            .ToList()
            .Select(EventService.MapEventResponse)
            .ToList();

        return ServiceResult<IReadOnlyList<EventResponse>>.Ok(events);
    }

    public ServiceResult<ClubStatisticsResponse> GetStatistics(int id)
    {
        var club = QueryClubs().FirstOrDefault(item => item.Id == id);
        if (club is null)
        {
            return ServiceResult<ClubStatisticsResponse>.NotFound();
        }

        var latestStatistic = club.Statistics.OrderByDescending(item => item.AcademicYear).FirstOrDefault();
        var eventCount = club.Events.Count;
        var allRegistrations = club.Events.SelectMany(@event => @event.Registrations).ToList();

        return ServiceResult<ClubStatisticsResponse>.Ok(new ClubStatisticsResponse
        {
            ClubId = club.Id,
            ClubName = club.Name,
            ActiveMemberCount = latestStatistic?.TotalMembers ?? club.ActualMemberCount ?? club.DeclaredMemberCount ?? club.Followers.Count,
            EventCount = eventCount,
            TotalRegistrations = allRegistrations.Count,
            TotalAttendance = club.Events.Sum(@event => @event.ParticipantCount ?? @event.ActualAttendanceCount),
            TotalBudget = club.Events.Sum(@event => @event.PosterCost + @event.CateringCost + @event.SpeakerFee),
            DeclaredMemberCount = club.DeclaredMemberCount,
            ActualMemberCount = club.ActualMemberCount,
            AcademicYear = latestStatistic?.AcademicYear ?? club.AcademicYear,
            FacultyDistribution = ParseDistribution(latestStatistic?.FacultyDistributionJson),
            DepartmentDistribution = ParseDistribution(latestStatistic?.DepartmentDistributionJson)
        });
    }

    public ServiceResult<IReadOnlyList<ClubManagerResponse>> GetManagers(int id)
    {
        if (!_dbContext.Clubs.Any(club => club.Id == id))
        {
            return ServiceResult<IReadOnlyList<ClubManagerResponse>>.NotFound();
        }

        var managers = _dbContext.ClubManagers
            .AsNoTracking()
            .Include(manager => manager.User)
            .Where(manager => manager.ClubId == id)
            .OrderBy(manager => manager.Role == "President" ? 0 : 1)
            .ThenBy(manager => manager.User!.FullName)
            .ToList()
            .Select(MapManager)
            .ToList();

        return ServiceResult<IReadOnlyList<ClubManagerResponse>>.Ok(managers);
    }

    public ServiceResult<ClubFollowStatusResponse> GetFollowStatus(int clubId, int currentUserId)
    {
        if (!_dbContext.Clubs.Any(club => club.Id == clubId))
        {
            return ServiceResult<ClubFollowStatusResponse>.NotFound("Kulüp bulunamadı.");
        }

        return ServiceResult<ClubFollowStatusResponse>.Ok(MapFollowStatus(clubId, currentUserId));
    }

    public ServiceResult<ClubFollowStatusResponse> Follow(int clubId, int currentUserId)
    {
        var club = _dbContext.Clubs.AsNoTracking().FirstOrDefault(item => item.Id == clubId);
        if (club is null)
        {
            return ServiceResult<ClubFollowStatusResponse>.NotFound("Kulüp bulunamadı.");
        }

        if (!_dbContext.Users.Any(user => user.Id == currentUserId))
        {
            return ServiceResult<ClubFollowStatusResponse>.NotFound("Kullanıcı bulunamadı.");
        }

        var exists = _dbContext.ClubFollowers.Any(item => item.ClubId == clubId && item.UserId == currentUserId);
        if (!exists)
        {
            _dbContext.ClubFollowers.Add(new ClubFollower
            {
                ClubId = clubId,
                UserId = currentUserId,
                FollowedAt = DateTime.UtcNow
            });
            _dbContext.SaveChanges();

            _notificationService.CreateForUsers([currentUserId], "Kulüp takip edildi", $"{club.Name} etkinlikleri için bildirim alacaksınız.", "Club", $"/clubs/{clubId}");
        }

        return ServiceResult<ClubFollowStatusResponse>.Ok(MapFollowStatus(clubId, currentUserId));
    }

    public ServiceResult<ClubFollowStatusResponse> Unfollow(int clubId, int currentUserId)
    {
        var follower = _dbContext.ClubFollowers.FirstOrDefault(item => item.ClubId == clubId && item.UserId == currentUserId);
        if (follower is not null)
        {
            _dbContext.ClubFollowers.Remove(follower);
            _dbContext.SaveChanges();
        }

        if (!_dbContext.Clubs.Any(club => club.Id == clubId))
        {
            return ServiceResult<ClubFollowStatusResponse>.NotFound("Kulüp bulunamadı.");
        }

        return ServiceResult<ClubFollowStatusResponse>.Ok(MapFollowStatus(clubId, currentUserId));
    }

    public ServiceResult<ClubManagerResponse> AddManager(int clubId, ClubManagerRequest request, int currentUserId, string currentUserRole)
    {
        if (!CanManageTeam(clubId, currentUserId, currentUserRole))
        {
            return ServiceResult<ClubManagerResponse>.Forbidden("Bu kulüp için yönetici ekleyemezsiniz.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == request.UserId);
        if (user is null)
        {
            return ServiceResult<ClubManagerResponse>.NotFound("Kullanıcı bulunamadı.");
        }

        if (!_dbContext.Clubs.Any(club => club.Id == clubId))
        {
            return ServiceResult<ClubManagerResponse>.NotFound("Kulüp bulunamadı.");
        }

        var normalizedRole = NormalizeManagerRole(request.Role);
        var existing = _dbContext.ClubManagers.Include(item => item.User).FirstOrDefault(item => item.ClubId == clubId && item.UserId == request.UserId);
        if (existing is not null)
        {
            return ServiceResult<ClubManagerResponse>.Conflict("Bu kullanıcı zaten yönetim ekibinde.");
        }

        if (_dbContext.ClubManagers.Any(item => item.UserId == request.UserId))
        {
            return ServiceResult<ClubManagerResponse>.Conflict("Bu kullanıcı başka bir kulübün yönetim ekibinde.");
        }

        var manager = new ClubManager
        {
            ClubId = clubId,
            UserId = request.UserId,
            Role = normalizedRole
        };

        _dbContext.ClubManagers.Add(manager);
        user.Role = UserRoles.ClubManager;
        user.ClubId = clubId;
        _dbContext.SaveChanges();

        _notificationService.CreateForUsers([user.Id], "Kulüp yönetimine eklendiniz", $"Yeni rolünüz: {ToDisplayManagerRole(normalizedRole)}.", "Club", $"/clubs/{clubId}");

        manager = _dbContext.ClubManagers.Include(item => item.User).First(item => item.Id == manager.Id);
        return ServiceResult<ClubManagerResponse>.Created(MapManager(manager));
    }

    public ServiceResult RemoveManager(int clubId, int managerId, int currentUserId, string currentUserRole)
    {
        if (!CanManageTeam(clubId, currentUserId, currentUserRole))
        {
            return ServiceResult.Forbidden("Bu kulüp için yönetici silemezsiniz.");
        }

        var manager = _dbContext.ClubManagers.Include(item => item.User).FirstOrDefault(item => item.Id == managerId && item.ClubId == clubId);
        if (manager is null)
        {
            return ServiceResult.NotFound("Yönetici kaydı bulunamadı.");
        }

        if (manager.Role == "President")
        {
            return ServiceResult.Forbidden("Başkan bu işlemle silinemez.");
        }

        if (manager.UserId == currentUserId)
        {
            return ServiceResult.Forbidden("Kendi yönetici kaydınizi kaldiramazsiniz.");
        }

        var user = manager.User;
        _dbContext.ClubManagers.Remove(manager);

        if (user is not null && user.ClubId == clubId && !_dbContext.ClubManagers.Any(item => item.Id != managerId && item.UserId == user.Id))
        {
            user.Role = UserRoles.Student;
            user.ClubId = null;
        }

        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    private bool CanManageTeam(int clubId, int currentUserId, string currentUserRole)
    {
        if (string.Equals(currentUserRole, UserRoles.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(currentUserRole, UserRoles.ClubManager, StringComparison.OrdinalIgnoreCase)
            && _dbContext.ClubManagers.Any(item => item.ClubId == clubId && item.UserId == currentUserId);
    }

    private bool CanDeleteClub(int clubId, int currentUserId, string currentUserRole)
    {
        if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return _dbContext.ClubManagers.Any(item =>
            item.ClubId == clubId &&
            item.UserId == currentUserId &&
            item.Role == "President");
    }

    private IQueryable<Club> QueryClubs() => _dbContext.Clubs
        .AsNoTracking()
        .Include(club => club.Events)
            .ThenInclude(@event => @event.Reviews)
        .Include(club => club.Events)
            .ThenInclude(@event => @event.Registrations)
        .Include(club => club.Followers)
        .Include(club => club.Managers)
        .Include(club => club.Statistics);

    internal static ClubResponse MapClubResponse(Club club)
    {
        var allReviews = club.Events.SelectMany(@event => @event.Reviews).ToList();

        return new ClubResponse
        {
            Id = club.Id,
            Name = club.Name,
            Description = club.Description,
            Category = club.Category,
            AvatarUrl = club.AvatarUrl,
            BannerUrl = club.BannerUrl,
            ShowcaseSummary = club.ShowcaseSummary,
            HighlightTitle = club.HighlightTitle,
            PresidentName = club.PresidentName,
            PresidentEmail = club.PresidentEmail,
            InstagramUrl = club.InstagramUrl,
            MemberCapacity = club.MemberCapacity,
            DeclaredMemberCount = club.DeclaredMemberCount,
            ActualMemberCount = club.ActualMemberCount,
            AcademicYear = club.AcademicYear,
            LogoUrl = club.LogoUrl,
            IsActive = club.IsActive,
            MemberCount = club.Followers.Count,
            AverageRating = allReviews.Count == 0 ? 0 : allReviews.Average(review => review.Rating),
            ReviewCount = allReviews.Count,
            RecentEventTitles = club.Events
                .OrderByDescending(@event => @event.StartDate)
                .Take(3)
                .Select(@event => @event.Title)
                .ToList()
        };
    }

    private ClubFollowStatusResponse MapFollowStatus(int clubId, int currentUserId) => new()
    {
        ClubId = clubId,
        IsFollowing = _dbContext.ClubFollowers.Any(item => item.ClubId == clubId && item.UserId == currentUserId),
        FollowerCount = _dbContext.ClubFollowers.Count(item => item.ClubId == clubId)
    };

    private static ClubManagerResponse MapManager(ClubManager manager) => new()
    {
        Id = manager.Id,
        ClubId = manager.ClubId,
        UserId = manager.UserId,
        UserFullName = manager.User?.FullName ?? string.Empty,
        UserEmail = manager.User?.Email ?? string.Empty,
        AvatarUrl = manager.User?.AvatarUrl ?? string.Empty,
        Role = manager.Role
    };

    private static string NormalizeManagerRole(string? role) =>
        string.Equals(role, "President", StringComparison.OrdinalIgnoreCase) ? "President" : "Manager";

    private static string ToDisplayManagerRole(string role) =>
        role == "President" ? "Başkan" : "Yönetici";

    private static IReadOnlyDictionary<string, int> ParseDistribution(string? json) =>
        string.IsNullOrWhiteSpace(json)
            ? new Dictionary<string, int>()
            : JsonSerializer.Deserialize<Dictionary<string, int>>(json) ?? new Dictionary<string, int>();

}
