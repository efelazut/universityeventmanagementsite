using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<UserResponse> GetAll() => _dbContext.Users.AsNoTracking().Select(MapProjection).ToList();

    public ServiceResult<UserResponse> GetById(int id)
    {
        var user = _dbContext.Users.AsNoTracking().FirstOrDefault(item => item.Id == id);
        return user is null ? ServiceResult<UserResponse>.NotFound() : ServiceResult<UserResponse>.Ok(Map(user));
    }

    public ServiceResult<UserResponse> Create(UserRequest request)
    {
        if (!UserRoles.IsSupported(request.Role))
        {
            return ServiceResult<UserResponse>.BadRequest("Invalid role");
        }

        if (request.ClubId.HasValue && !_dbContext.Clubs.Any(club => club.Id == request.ClubId.Value))
        {
            return ServiceResult<UserResponse>.NotFound("Club not found");
        }

        var normalizedEmail = request.Email.Trim();
        if (_dbContext.Users.AsNoTracking().Any(user => user.Email.ToLower() == normalizedEmail.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Email is already registered");
        }

        var createdUser = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = request.PasswordHash,
            Role = UserRoles.Normalize(request.Role),
            Department = request.Department.Trim(),
            Faculty = request.Faculty.Trim(),
            StudentNumber = request.StudentNumber.Trim(),
            YearClass = request.YearClass.Trim(),
            IsActiveMember = request.IsActiveMember,
            ClubId = request.ClubId
        };

        _dbContext.Users.Add(createdUser);
        _dbContext.SaveChanges();

        return ServiceResult<UserResponse>.Created(Map(createdUser));
    }

    public ServiceResult<UserResponse> Update(int id, UserRequest request)
    {
        if (!UserRoles.IsSupported(request.Role))
        {
            return ServiceResult<UserResponse>.BadRequest("Invalid role");
        }

        var existingUser = _dbContext.Users.FirstOrDefault(user => user.Id == id);
        if (existingUser is null)
        {
            return ServiceResult<UserResponse>.NotFound();
        }

        if (request.ClubId.HasValue && !_dbContext.Clubs.Any(club => club.Id == request.ClubId.Value))
        {
            return ServiceResult<UserResponse>.NotFound("Club not found");
        }

        var normalizedEmail = request.Email.Trim();
        if (_dbContext.Users.AsNoTracking().Any(user => user.Id != id && user.Email.ToLower() == normalizedEmail.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Email is already registered");
        }

        existingUser.FullName = request.FullName.Trim();
        existingUser.Email = normalizedEmail;
        existingUser.PasswordHash = request.PasswordHash;
        existingUser.Role = UserRoles.Normalize(request.Role);
        existingUser.Department = request.Department.Trim();
        existingUser.Faculty = request.Faculty.Trim();
        existingUser.StudentNumber = request.StudentNumber.Trim();
        existingUser.YearClass = request.YearClass.Trim();
        existingUser.IsActiveMember = request.IsActiveMember;
        existingUser.ClubId = request.ClubId;

        _dbContext.SaveChanges();
        return ServiceResult<UserResponse>.Ok(Map(existingUser));
    }

    public ServiceResult Delete(int id)
    {
        var user = _dbContext.Users.FirstOrDefault(item => item.Id == id);
        if (user is null)
        {
            return ServiceResult.NotFound();
        }

        var hasRelatedData = _dbContext.Registrations.Any(registration => registration.UserId == id)
            || _dbContext.EventReviews.Any(review => review.UserId == id);

        if (hasRelatedData)
        {
            return ServiceResult.Conflict("Cannot delete a user with registrations or reviews.");
        }

        _dbContext.Users.Remove(user);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public IReadOnlyList<UserResponse> GetByClubId(int clubId) => _dbContext.Users
        .AsNoTracking()
        .Where(user => user.ClubId == clubId)
        .Select(MapProjection)
        .ToList();

    public ServiceResult<UserProfileResponse> GetCurrentUser(int? userId, string? email)
    {
        var user = ResolveCurrentUser(userId, email);
        if (user is null)
        {
            return ServiceResult<UserProfileResponse>.NotFound("Kullanıcı kaydı bulunamadı.");
        }

        return ServiceResult<UserProfileResponse>.Ok(new UserProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Faculty = user.Faculty,
            Department = user.Department,
            StudentNumber = user.StudentNumber,
            YearClass = user.YearClass,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            Role = user.Role,
            IsActiveMember = user.IsActiveMember,
            ClubId = user.ClubId,
            ClubName = user.Club?.Name
        });
    }

    public ServiceResult<UserEventActivityResponse> GetCurrentUserEvents(int? userId, string? email)
    {
        var user = ResolveCurrentUser(userId, email);
        if (user is null)
        {
            return ServiceResult<UserEventActivityResponse>.Ok(new UserEventActivityResponse());
        }

        var now = DateTime.UtcNow;
        var items = _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.UserId == user.Id && registration.Event != null)
            .Select(registration => new UserEventActivityItemResponse
            {
                Id = registration.Event!.Id,
                Title = registration.Event.Title,
                Description = registration.Event.Description,
                StartDate = registration.Event.StartDate,
                EndDate = registration.Event.EndDate,
                Status = registration.Event.Status,
                ClubId = registration.Event.ClubId,
                RoomId = registration.Event.RoomId,
                RegisteredAt = registration.RegisteredAt,
                Attended = registration.Attended
            })
            .OrderBy(item => item.StartDate)
            .ToList();

        return ServiceResult<UserEventActivityResponse>.Ok(new UserEventActivityResponse
        {
            RegisteredEvents = items,
            AttendedEvents = items.Where(item => item.Attended).OrderByDescending(item => item.StartDate).ToList(),
            UpcomingRegistrations = items.Where(item => item.StartDate >= now).ToList()
        });
    }

    public ServiceResult<OrganizerProfileResponse> GetOrganizerProfile(int id)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .Include(item => item.Club)
            .Include(item => item.ManagedClubs)
                .ThenInclude(manager => manager.Club)
            .FirstOrDefault(item => item.Id == id);

        if (user is null)
        {
            return ServiceResult<OrganizerProfileResponse>.NotFound("Yönetici bulunamadı.");
        }

        var managedClubIds = user.ManagedClubs
            .Select(manager => manager.ClubId)
            .Distinct()
            .ToList();

        if (managedClubIds.Count == 0 && user.ClubId.HasValue)
        {
            managedClubIds.Add(user.ClubId.Value);
        }

        var events = _dbContext.Events
            .AsNoTracking()
            .Include(item => item.Club)
            .Include(item => item.Reviews)
            .Where(item => item.ClubId.HasValue && managedClubIds.Contains(item.ClubId.Value))
            .OrderByDescending(item => item.StartDate)
            .ToList();

        var allReviews = events.SelectMany(item => item.Reviews).ToList();

        return ServiceResult<OrganizerProfileResponse>.Ok(new OrganizerProfileResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Bio = user.Bio,
            PrimaryClubName = user.Club?.Name ?? user.ManagedClubs.FirstOrDefault()?.Club?.Name ?? "Kulüp bilgisi yok",
            PrimaryClubCategory = user.Club?.Category ?? user.ManagedClubs.FirstOrDefault()?.Club?.Category ?? string.Empty,
            ManagedClubNames = user.ManagedClubs
                .Select(manager => manager.Club?.Name ?? string.Empty)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList(),
            TotalEventCount = events.Count,
            AverageEventRating = allReviews.Count == 0 ? 0 : allReviews.Average(review => review.Rating),
            TotalReviewCount = allReviews.Count,
            Events = events.Select(item => new OrganizerEventSummaryResponse
            {
                Id = item.Id,
                Title = item.Title,
                ImageUrl = item.ImageUrl,
                StartDate = item.StartDate,
                ClubName = item.Club?.Name ?? string.Empty,
                Status = EventService.ComputeStatus(item),
                AverageRating = item.Reviews.Count == 0 ? 0 : item.Reviews.Average(review => review.Rating),
                ReviewCount = item.Reviews.Count
            }).ToList()
        });
    }

    private User? ResolveCurrentUser(int? userId, string? email)
    {
        if (userId.HasValue)
        {
            var byId = _dbContext.Users.AsNoTracking().Include(item => item.Club).FirstOrDefault(item => item.Id == userId.Value);
            if (byId is not null)
            {
                return byId;
            }
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            return _dbContext.Users
                .AsNoTracking()
                .Include(item => item.Club)
                .FirstOrDefault(item => item.Email.ToLower() == email.Trim().ToLower());
        }

        return null;
    }

    private static UserResponse Map(User user) => new()
    {
        Id = user.Id,
        Name = user.FullName,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        Department = user.Department,
        Faculty = user.Faculty,
        StudentNumber = user.StudentNumber,
        YearClass = user.YearClass,
        AvatarUrl = user.AvatarUrl,
        Bio = user.Bio,
        IsActiveMember = user.IsActiveMember,
        ClubId = user.ClubId
    };

    private static System.Linq.Expressions.Expression<Func<User, UserResponse>> MapProjection => user => new UserResponse
    {
        Id = user.Id,
        Name = user.FullName,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        Department = user.Department,
        Faculty = user.Faculty,
        StudentNumber = user.StudentNumber,
        YearClass = user.YearClass,
        AvatarUrl = user.AvatarUrl,
        Bio = user.Bio,
        IsActiveMember = user.IsActiveMember,
        ClubId = user.ClubId
    };
}
