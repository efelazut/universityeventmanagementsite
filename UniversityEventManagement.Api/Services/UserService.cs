using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Services;

public class UserService : IUserService
{
    private static readonly IReadOnlyDictionary<string, string[]> AllowedDepartmentsByFaculty = new Dictionary<string, string[]>
    {
        ["Mühendislik ve Doğa Bilimleri Fakültesi"] =
        [
            "Yazılım Mühendisliği",
            "Bilgisayar Mühendisliği",
            "Endüstri Mühendisliği",
            "Elektrik-Elektronik Mühendisliği"
        ],
        ["İşletme ve Yönetim Bilimleri Fakültesi"] =
        [
            "İşletme",
            "Uluslararası Ticaret ve Lojistik",
            "Ekonomi ve Finans",
            "Siyaset Bilimi ve Uluslararası İlişkiler"
        ],
        ["Hukuk Fakültesi"] = ["Hukuk"],
        ["İletişim Fakültesi"] =
        [
            "Halkla İlişkiler ve Tanıtım",
            "Görsel İletişim Tasarımı",
            "Radyo, Televizyon ve Sinema"
        ],
        ["Mimarlık ve Tasarım Fakültesi"] =
        [
            "Mimarlık",
            "İç Mimarlık",
            "Endüstriyel Tasarım"
        ],
        ["Eğitim Fakültesi"] =
        [
            "Rehberlik ve Psikolojik Danışmanlık",
            "Okul Öncesi Öğretmenliği",
            "İngilizce Öğretmenliği"
        ],
        ["İnsan ve Toplum Bilimleri Fakültesi"] =
        [
            "Psikoloji",
            "Sosyoloji",
            "Felsefe"
        ],
        ["Güzel Sanatlar Fakültesi"] =
        [
            "Grafik Tasarımı",
            "Sahne Sanatları",
            "Plastik Sanatlar"
        ],
        ["Tıp Fakültesi"] = ["Tıp"],
        ["Hemşirelik Yüksekokulu"] = ["Hemşirelik"],
        ["Meslek Yüksekokulu"] =
        [
            "Bilgisayar Programcılığı",
            "Dış Ticaret",
            "Grafik Tasarımı"
        ]
    };

    private static readonly IReadOnlySet<string> AllowedYearClasses = new HashSet<string>
    {
        "Hazırlık",
        "1. Sınıf",
        "2. Sınıf",
        "3. Sınıf",
        "4. Sınıf",
        "Mezun"
    };

    private readonly AppDbContext _dbContext;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<UserResponse> GetAll() => _dbContext.Users
        .AsNoTracking()
        .Include(user => user.ManagedClubs)
            .ThenInclude(manager => manager.Club)
        .ToList()
        .Select(Map)
        .ToList();

    public ServiceResult<UserResponse> GetById(int id)
    {
        var user = _dbContext.Users
            .AsNoTracking()
            .Include(item => item.ManagedClubs)
                .ThenInclude(manager => manager.Club)
            .FirstOrDefault(item => item.Id == id);
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
        if (!IsAsciiEmail(normalizedEmail))
        {
            return ServiceResult<UserResponse>.BadRequest("Geçerli ve Türkçe karakter içermeyen bir e-posta girin.");
        }

        if (_dbContext.Users.AsNoTracking().Any(user => user.Email.ToLower() == normalizedEmail.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Bu e-posta zaten kullanılıyor.");
        }

        var normalizedStudentNumber = request.StudentNumber.Trim();
        if (_dbContext.Users.AsNoTracking().Any(user => user.StudentNumber.ToLower() == normalizedStudentNumber.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Bu öğrenci numarası kayıtlı.");
        }

        var createdUser = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            Role = UserRoles.Normalize(request.Role),
            Department = request.Department.Trim(),
            Faculty = request.Faculty.Trim(),
            StudentNumber = normalizedStudentNumber,
            YearClass = request.YearClass.Trim(),
            IsActiveMember = request.IsActiveMember,
            ClubId = request.ClubId
        };
        createdUser.PasswordHash = _passwordHasher.HashPassword(createdUser, request.PasswordHash);

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
        if (!IsAsciiEmail(normalizedEmail))
        {
            return ServiceResult<UserResponse>.BadRequest("Geçerli ve Türkçe karakter içermeyen bir e-posta girin.");
        }

        if (_dbContext.Users.AsNoTracking().Any(user => user.Id != id && user.Email.ToLower() == normalizedEmail.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Bu e-posta zaten kullanılıyor.");
        }

        var normalizedStudentNumber = request.StudentNumber.Trim();
        if (_dbContext.Users.AsNoTracking().Any(user => user.Id != id && user.StudentNumber.ToLower() == normalizedStudentNumber.ToLower()))
        {
            return ServiceResult<UserResponse>.Conflict("Bu öğrenci numarası kayıtlı.");
        }

        existingUser.FullName = request.FullName.Trim();
        existingUser.Email = normalizedEmail;
        existingUser.PasswordHash = _passwordHasher.HashPassword(existingUser, request.PasswordHash);
        existingUser.Role = UserRoles.Normalize(request.Role);
        existingUser.Department = request.Department.Trim();
        existingUser.Faculty = request.Faculty.Trim();
        existingUser.StudentNumber = normalizedStudentNumber;
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
            ClubName = user.Club?.Name,
            ManagedClubs = user.ManagedClubs
                .Where(manager => manager.Club is not null)
                .Select(manager => new ManagedClubSummaryResponse
                {
                    ClubId = manager.ClubId,
                    ClubName = manager.Club!.Name,
                    Role = manager.Role
                })
                .ToList()
        });
    }

    public ServiceResult<UserProfileResponse> UpdateCurrentUser(int? userId, string? email, UpdateCurrentUserRequest request)
    {
        var user = ResolveCurrentUserForUpdate(userId, email);
        if (user is null)
        {
            return ServiceResult<UserProfileResponse>.NotFound("Kullanıcı kaydı bulunamadı.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (!IsAsciiEmail(normalizedEmail))
        {
            return ServiceResult<UserProfileResponse>.BadRequest("Geçerli ve Türkçe karakter içermeyen bir e-posta girin.");
        }

        if (_dbContext.Users.AsNoTracking().Any(item => item.Id != user.Id && item.Email.ToLower() == normalizedEmail))
        {
            return ServiceResult<UserProfileResponse>.Conflict("Bu e-posta zaten kullanılıyor.");
        }

        user.Email = normalizedEmail;
        _dbContext.SaveChanges();

        return GetCurrentUser(user.Id, user.Email);
    }

    public ServiceResult<UserProfileResponse> UpdateCurrentUserAcademicInfo(int? userId, string? email, UpdateAcademicInfoRequest request)
    {
        var user = ResolveCurrentUserForUpdate(userId, email);
        if (user is null)
        {
            return ServiceResult<UserProfileResponse>.NotFound("Kullanıcı kaydı bulunamadı.");
        }

        var faculty = NormalizeOptionalText(request.Faculty, 150);
        var department = NormalizeOptionalText(request.Department, 150);
        var yearClass = NormalizeOptionalText(request.YearClass, 50);

        if (!string.IsNullOrWhiteSpace(faculty) && !AllowedDepartmentsByFaculty.ContainsKey(faculty))
        {
            return ServiceResult<UserProfileResponse>.BadRequest("Lütfen listeden geçerli bir fakülte seçin.");
        }

        if (!string.IsNullOrWhiteSpace(department))
        {
            if (string.IsNullOrWhiteSpace(faculty))
            {
                return ServiceResult<UserProfileResponse>.BadRequest("Bölüm seçmek için önce fakülte seçin.");
            }

            if (!AllowedDepartmentsByFaculty[faculty].Contains(department))
            {
                return ServiceResult<UserProfileResponse>.BadRequest("Seçilen bölüm bu fakülteye ait değil.");
            }
        }

        if (!string.IsNullOrWhiteSpace(yearClass) && !AllowedYearClasses.Contains(yearClass))
        {
            return ServiceResult<UserProfileResponse>.BadRequest("Lütfen listeden geçerli bir sınıf / yıl seçin.");
        }

        user.Faculty = faculty;
        user.Department = department;
        user.YearClass = yearClass;
        _dbContext.SaveChanges();

        return GetCurrentUser(user.Id, user.Email);
    }

    public ServiceResult ChangeCurrentUserPassword(int? userId, string? email, UpdatePasswordRequest request)
    {
        if (!userId.HasValue && string.IsNullOrWhiteSpace(email))
        {
            return ServiceResult.Unauthorized("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
        }

        var user = ResolveCurrentUserForUpdate(userId, email);
        if (user is null)
        {
            return ServiceResult.BadRequest("Kullanıcı bilgileri alınamadı.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return ServiceResult.BadRequest("Şifre alanları boş bırakılamaz.");
        }

        if (request.NewPassword.Length < 6)
        {
            return ServiceResult.BadRequest("Yeni şifre en az 6 karakter olmalıdır.");
        }

        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return ServiceResult.BadRequest("Yeni şifreler eşleşmiyor.");
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            return ServiceResult.BadRequest("Yeni şifre mevcut şifreyle aynı olamaz.");
        }

        if (!VerifyPassword(user, request.CurrentPassword, out _))
        {
            return ServiceResult.BadRequest("Mevcut şifre yanlış.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
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
            var byId = _dbContext.Users
                .AsNoTracking()
                .Include(item => item.Club)
                .Include(item => item.ManagedClubs)
                    .ThenInclude(manager => manager.Club)
                .FirstOrDefault(item => item.Id == userId.Value);
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
                .Include(item => item.ManagedClubs)
                    .ThenInclude(manager => manager.Club)
                .FirstOrDefault(item => item.Email.ToLower() == email.Trim().ToLower());
        }

        return null;
    }

    private User? ResolveCurrentUserForUpdate(int? userId, string? email)
    {
        if (userId.HasValue)
        {
            var byId = _dbContext.Users.FirstOrDefault(item => item.Id == userId.Value);
            if (byId is not null)
            {
                return byId;
            }
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            return _dbContext.Users.FirstOrDefault(item => item.Email.ToLower() == email.Trim().ToLower());
        }

        return null;
    }

    private static bool IsAsciiEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !Regex.IsMatch(email, "^[\\u0000-\\u007F]+$"))
        {
            return false;
        }

        try
        {
            var address = new MailAddress(email);
            return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private bool VerifyPassword(User user, string password, out bool shouldRehash)
    {
        shouldRehash = false;

        try
        {
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
            shouldRehash = result == PasswordVerificationResult.SuccessRehashNeeded;
            return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string NormalizeOptionalText(string? value, int maxLength)
    {
        var normalized = Regex.Replace((value ?? string.Empty).Trim(), "\\s+", " ");
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
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
        ClubId = user.ClubId,
        ManagedClubs = user.ManagedClubs
            .Where(manager => manager.Club is not null)
            .Select(manager => new ManagedClubSummaryResponse
            {
                ClubId = manager.ClubId,
                ClubName = manager.Club!.Name,
                Role = manager.Role
            })
            .ToList()
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
