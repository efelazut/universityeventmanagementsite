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

    public ServiceResult Delete(int id)
    {
        var club = _dbContext.Clubs.FirstOrDefault(item => item.Id == id);
        if (club is null)
        {
            return ServiceResult.NotFound();
        }

        var hasDependencies = _dbContext.Users.Any(user => user.ClubId == id)
            || _dbContext.Events.Any(@event => @event.ClubId == id)
            || _dbContext.ClubMemberships.Any(membership => membership.ClubId == id);

        if (hasDependencies)
        {
            return ServiceResult.Conflict("Cannot delete a club that still has members or events.");
        }

        _dbContext.Clubs.Remove(club);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public ServiceResult<IReadOnlyList<ClubMembershipResponse>> GetMembers(int id)
    {
        if (!_dbContext.Clubs.Any(club => club.Id == id))
        {
            return ServiceResult<IReadOnlyList<ClubMembershipResponse>>.NotFound();
        }

        var members = _dbContext.ClubMemberships
            .AsNoTracking()
            .Include(membership => membership.User)
            .Where(membership => membership.ClubId == id)
            .OrderBy(membership => membership.Role)
            .ThenBy(membership => membership.User!.FullName)
            .ToList()
            .Select(MapMembership)
            .ToList();

        return ServiceResult<IReadOnlyList<ClubMembershipResponse>>.Ok(members);
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

        var activeMemberCount = club.Memberships.Count(membership => membership.Status == "Active");
        var eventCount = club.Events.Count;
        var allRegistrations = club.Events.SelectMany(@event => @event.Registrations).ToList();

        return ServiceResult<ClubStatisticsResponse>.Ok(new ClubStatisticsResponse
        {
            ClubId = club.Id,
            ClubName = club.Name,
            ActiveMemberCount = activeMemberCount,
            EventCount = eventCount,
            TotalRegistrations = allRegistrations.Count,
            TotalAttendance = allRegistrations.Count(registration => registration.Attended),
            TotalBudget = club.Events.Sum(@event => @event.PosterCost + @event.CateringCost + @event.SpeakerFee)
        });
    }

    public ServiceResult<ClubMembershipResponse> Join(int clubId, int currentUserId)
    {
        var club = _dbContext.Clubs.AsNoTracking().FirstOrDefault(item => item.Id == clubId);
        if (club is null)
        {
            return ServiceResult<ClubMembershipResponse>.NotFound("Kulup bulunamadi.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == currentUserId);
        if (user is null)
        {
            return ServiceResult<ClubMembershipResponse>.NotFound("Kullanici bulunamadi.");
        }

        var existingMembership = _dbContext.ClubMemberships
            .Include(membership => membership.User)
            .FirstOrDefault(membership => membership.ClubId == clubId && membership.UserId == currentUserId);

        if (existingMembership is not null)
        {
            return ServiceResult<ClubMembershipResponse>.Conflict("Bu kulubun zaten bir uyesisiniz.");
        }

        var membership = new ClubMembership
        {
            ClubId = clubId,
            UserId = currentUserId,
            Role = "Member",
            Status = "Active",
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.ClubMemberships.Add(membership);
        _dbContext.SaveChanges();

        _notificationService.CreateForUsers([currentUserId], "Kulube katildiniz", $"{club.Name} topluluguna uye oldunuz.", "Club", $"/clubs/{clubId}");

        membership = _dbContext.ClubMemberships.Include(item => item.User).First(item => item.Id == membership.Id);
        return ServiceResult<ClubMembershipResponse>.Created(MapMembership(membership));
    }

    public ServiceResult<ClubMembershipResponse> AssignOfficer(int clubId, ClubMembershipRequest request, int currentUserId, string currentUserRole)
    {
        if (!CanManageClub(clubId, currentUserId, currentUserRole))
        {
            return ServiceResult<ClubMembershipResponse>.Forbidden("Bu kulup icin yonetici atayamazsiniz.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == request.UserId);
        if (user is null)
        {
            return ServiceResult<ClubMembershipResponse>.NotFound("Kullanici bulunamadi.");
        }

        var membership = _dbContext.ClubMemberships.Include(item => item.User).FirstOrDefault(item => item.ClubId == clubId && item.UserId == request.UserId);
        if (membership is null)
        {
            membership = new ClubMembership
            {
                ClubId = clubId,
                UserId = request.UserId,
                JoinedAt = DateTime.UtcNow,
                Status = "Active",
                Role = NormalizeMembershipRole(request.Role)
            };
            _dbContext.ClubMemberships.Add(membership);
        }
        else
        {
            membership.Role = NormalizeMembershipRole(request.Role);
            membership.Status = "Active";
        }

        if (membership.Role != "Member")
        {
            user.Role = UserRoles.ClubManager;
            user.ClubId = clubId;
        }

        _dbContext.SaveChanges();

        _notificationService.CreateForUsers([user.Id], "Kulup yetkiniz guncellendi", $"Kulup icindeki yeni rolnuz: {membership.Role}.", "Club", $"/clubs/{clubId}");

        membership = _dbContext.ClubMemberships.Include(item => item.User).First(item => item.Id == membership.Id);
        return ServiceResult<ClubMembershipResponse>.Ok(MapMembership(membership));
    }

    public ServiceResult RemoveMembership(int clubId, int membershipId, int currentUserId, string currentUserRole)
    {
        if (!CanManageClub(clubId, currentUserId, currentUserRole))
        {
            return ServiceResult.Forbidden("Bu uye kaydini kaldiramazsiniz.");
        }

        var membership = _dbContext.ClubMemberships
            .Include(item => item.User)
            .FirstOrDefault(item => item.Id == membershipId && item.ClubId == clubId);

        if (membership is null)
        {
            return ServiceResult.NotFound("Uyelik bulunamadi.");
        }

        if (membership.Role == "President")
        {
            return ServiceResult.Forbidden("Baskan kaydi bu islemle kaldirilamaz.");
        }

        _dbContext.ClubMemberships.Remove(membership);

        if (membership.User is not null && membership.User.ClubId == clubId && membership.User.Role == UserRoles.ClubManager)
        {
            membership.User.Role = UserRoles.Student;
            membership.User.ClubId = null;
        }

        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public ServiceResult<ClubResponse> AssignPresident(int clubId, int userId)
    {
        var club = _dbContext.Clubs.FirstOrDefault(item => item.Id == clubId);
        if (club is null)
        {
            return ServiceResult<ClubResponse>.NotFound("Kulup bulunamadi.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == userId);
        if (user is null)
        {
            return ServiceResult<ClubResponse>.NotFound("Kullanici bulunamadi.");
        }

        var previousPresident = _dbContext.ClubMemberships.FirstOrDefault(item => item.ClubId == clubId && item.Role == "President");
        if (previousPresident is not null)
        {
            previousPresident.Role = "Assistant";
        }

        var membership = _dbContext.ClubMemberships.FirstOrDefault(item => item.ClubId == clubId && item.UserId == userId);
        if (membership is null)
        {
            membership = new ClubMembership
            {
                ClubId = clubId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow,
                Status = "Active",
                Role = "President"
            };
            _dbContext.ClubMemberships.Add(membership);
        }
        else
        {
            membership.Role = "President";
            membership.Status = "Active";
        }

        user.Role = UserRoles.ClubManager;
        user.ClubId = clubId;
        club.PresidentName = user.FullName;
        club.PresidentEmail = user.Email;

        _dbContext.SaveChanges();

        _notificationService.CreateForUsers([userId], "Kulup baskanligi atamasi", $"{club.Name} kulubunun baskani olarak atandiniz.", "Club", $"/clubs/{clubId}");

        return ServiceResult<ClubResponse>.Ok(MapClubResponse(QueryClubs().First(item => item.Id == clubId)));
    }

    private bool CanManageClub(int clubId, int currentUserId, string currentUserRole)
    {
        if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return _dbContext.ClubMemberships.Any(item =>
            item.ClubId == clubId &&
            item.UserId == currentUserId &&
            item.Status == "Active" &&
            item.Role == "President");
    }

    private static string NormalizeMembershipRole(string? role)
    {
        if (string.Equals(role, "President", StringComparison.OrdinalIgnoreCase))
        {
            return "President";
        }

        if (string.Equals(role, "Assistant", StringComparison.OrdinalIgnoreCase))
        {
            return "Assistant";
        }

        return "Member";
    }

    private IQueryable<Club> QueryClubs() => _dbContext.Clubs
        .AsNoTracking()
        .Include(club => club.Events)
            .ThenInclude(@event => @event.Reviews)
        .Include(club => club.Events)
            .ThenInclude(@event => @event.Registrations)
        .Include(club => club.Memberships)
        .Include(club => club.Members);

    internal static ClubResponse MapClubResponse(Club club)
    {
        var activeMemberships = club.Memberships.Where(item => item.Status == "Active").ToList();
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
            IsActive = club.IsActive,
            MemberCount = activeMemberships.Count != 0 ? activeMemberships.Count : club.Members.Count,
            AverageRating = allReviews.Count == 0 ? 0 : allReviews.Average(review => review.Rating),
            ReviewCount = allReviews.Count,
            RecentEventTitles = club.Events
                .OrderByDescending(@event => @event.StartDate)
                .Take(3)
                .Select(@event => @event.Title)
                .ToList()
        };
    }

    private static ClubMembershipResponse MapMembership(ClubMembership membership) => new()
    {
        Id = membership.Id,
        ClubId = membership.ClubId,
        UserId = membership.UserId,
        UserFullName = membership.User?.FullName ?? string.Empty,
        UserEmail = membership.User?.Email ?? string.Empty,
        Role = membership.Role,
        Status = membership.Status,
        JoinedAt = membership.JoinedAt
    };
}
