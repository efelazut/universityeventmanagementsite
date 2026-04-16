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

    public IReadOnlyList<UserResponse> GetAll() => _dbContext.Users
        .AsNoTracking()
        .Select(user => new UserResponse
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
        })
        .ToList();

    public ServiceResult<UserResponse> GetById(int id)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(item => item.Id == id);

        return user is null
            ? ServiceResult<UserResponse>.NotFound()
            : ServiceResult<UserResponse>.Ok(Map(user));
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
        var existingUser = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(user => user.Email.ToLower() == normalizedEmail.ToLower());

        if (existingUser is not null)
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
        var duplicateEmail = _dbContext.Users
            .AsNoTracking()
            .Any(user => user.Id != id && user.Email.ToLower() == normalizedEmail.ToLower());

        if (duplicateEmail)
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
        .Select(user => new UserResponse
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
        })
        .ToList();

    public ServiceResult<UserProfileResponse> GetCurrentUser(string email)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .Where(item => item.Email.ToLower() == email.Trim().ToLower())
            .Select(item => new UserProfileResponse
            {
                Id = item.Id,
                FullName = item.FullName,
                Email = item.Email,
                Faculty = item.Faculty,
                Department = item.Department,
                StudentNumber = item.StudentNumber,
                YearClass = item.YearClass,
                AvatarUrl = item.AvatarUrl,
                Bio = item.Bio,
                Role = item.Role,
                IsActiveMember = item.IsActiveMember,
                ClubId = item.ClubId,
                ClubName = item.Club != null ? item.Club.Name : null
            })
            .FirstOrDefault();

        return user is null
            ? ServiceResult<UserProfileResponse>.NotFound("User not found")
            : ServiceResult<UserProfileResponse>.Ok(user);
    }

    public ServiceResult<UserEventActivityResponse> GetCurrentUserEvents(string email)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(item => item.Email.ToLower() == email.Trim().ToLower());

        if (user is null)
        {
            return ServiceResult<UserEventActivityResponse>.NotFound("User not found");
        }

        var now = DateTime.UtcNow;
        var items = _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.UserId == user.Id)
            .Where(registration => registration.Event != null)
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
}
