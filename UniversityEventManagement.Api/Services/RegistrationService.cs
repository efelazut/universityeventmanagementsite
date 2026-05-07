using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class RegistrationService : IRegistrationService
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public RegistrationService(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public IReadOnlyList<RegistrationResponse> GetAll() => _dbContext.Registrations
        .AsNoTracking()
        .Include(registration => registration.User)
        .Include(registration => registration.Event)
        .Select(Map)
        .ToList();

    public ServiceResult<RegistrationResponse> GetById(int id)
    {
        var registration = _dbContext.Registrations
            .AsNoTracking()
            .Include(item => item.User)
            .Include(item => item.Event)
            .FirstOrDefault(item => item.Id == id);

        return registration is null
            ? ServiceResult<RegistrationResponse>.NotFound()
            : ServiceResult<RegistrationResponse>.Ok(Map(registration));
    }

    public ServiceResult<RegistrationResponse> Create(RegistrationRequest request, int currentUserId, string currentUserRole)
    {
        if (!string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult<RegistrationResponse>.Forbidden("Sadece öğrenciler kayıt olabilir.");
        }

        var @event = _dbContext.Events.Include(item => item.Club).FirstOrDefault(item => item.Id == request.EventId);
        if (@event is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound("Etkinlik bulunamadı.");
        }

        if (@event.StartDate <= DateTime.UtcNow)
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Baslamis etkinliklere kayıt yapılamaz.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == currentUserId);
        if (user is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound("Kullanıcı bulunamadı.");
        }

        if (!user.IsActiveMember)
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Kullanıcı aktif üye değil.");
        }

        var duplicateRegistration = _dbContext.Registrations.Any(existingRegistration =>
            existingRegistration.EventId == request.EventId &&
            existingRegistration.UserId == currentUserId);

        if (duplicateRegistration)
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Bu etkinlige zaten kayıtlisiniz.");
        }

        var approvedCount = _dbContext.Registrations.Count(existingRegistration =>
            existingRegistration.EventId == request.EventId &&
            existingRegistration.Status == "Approved");

        if (approvedCount >= @event.Capacity)
        {
            return ServiceResult<RegistrationResponse>.BadRequest("Etkinlik kontenjani dolu.");
        }

        var status = @event.RequiresApproval ? "Pending" : "Approved";
        var createdRegistration = new Registration
        {
            UserId = currentUserId,
            EventId = request.EventId,
            RegisteredAt = request.RegisteredAt ?? DateTime.UtcNow,
            Status = status,
            Attended = false
        };

        _dbContext.Registrations.Add(createdRegistration);
        _dbContext.SaveChanges();

        if (@event.RequiresApproval)
        {
            var recipientIds = _dbContext.ClubManagers
                .AsNoTracking()
                .Where(manager => manager.ClubId == @event.ClubId)
                .Select(manager => manager.UserId)
                .ToList();

            _notificationService.CreateForUsers(recipientIds, "Yeni katılım başvurusu", $"{user.FullName}, {@event.Title} için başvuru gönderdi.", "Registration", $"/events/{@event.Id}");
        }
        else
        {
            _notificationService.CreateForUsers([currentUserId], "Kayıt onaylandı", $"{@event.Title} etkinligi için kaydıniz oluşturuldu.", "Registration", $"/events/{@event.Id}");
        }

        var responseRegistration = _dbContext.Registrations
            .AsNoTracking()
            .Include(item => item.User)
            .Include(item => item.Event)
            .First(item => item.Id == createdRegistration.Id);

        return ServiceResult<RegistrationResponse>.Created(Map(responseRegistration));
    }

    public ServiceResult<RegistrationResponse> Update(int id, RegistrationRequest request)
    {
        var existingRegistration = _dbContext.Registrations.FirstOrDefault(item => item.Id == id);
        if (existingRegistration is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound();
        }

        var duplicateRegistration = _dbContext.Registrations
            .AsNoTracking()
            .Any(item =>
                item.Id != id &&
                item.EventId == request.EventId &&
                item.UserId == request.UserId);

        if (duplicateRegistration)
        {
            return ServiceResult<RegistrationResponse>.Conflict("A registration for this user and event already exists.");
        }

        if (!_dbContext.Events.Any(item => item.Id == request.EventId))
        {
            return ServiceResult<RegistrationResponse>.NotFound("Etkinlik bulunamadı.");
        }

        if (!_dbContext.Users.Any(item => item.Id == request.UserId))
        {
            return ServiceResult<RegistrationResponse>.NotFound("Kullanıcı bulunamadı.");
        }

        existingRegistration.UserId = request.UserId;
        existingRegistration.EventId = request.EventId;
        existingRegistration.RegisteredAt = request.RegisteredAt ?? existingRegistration.RegisteredAt;
        existingRegistration.Status = string.IsNullOrWhiteSpace(request.Status) ? existingRegistration.Status : request.Status.Trim();
        existingRegistration.Attended = request.Attended;

        _dbContext.SaveChanges();

        var responseRegistration = _dbContext.Registrations.AsNoTracking().Include(item => item.User).Include(item => item.Event).First(item => item.Id == id);
        return ServiceResult<RegistrationResponse>.Ok(Map(responseRegistration));
    }

    public ServiceResult Delete(int id)
    {
        var registration = _dbContext.Registrations.FirstOrDefault(item => item.Id == id);
        if (registration is null)
        {
            return ServiceResult.NotFound();
        }

        _dbContext.Registrations.Remove(registration);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public ServiceResult CancelForUser(int eventId, int currentUserId, string currentUserRole)
    {
        if (!string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult.Forbidden("Sadece öğrenciler kayıt iptal edebilir.");
        }

        var @event = _dbContext.Events.FirstOrDefault(item => item.Id == eventId);
        if (@event is null)
        {
            return ServiceResult.NotFound("Etkinlik bulunamadı.");
        }

        if (@event.StartDate <= DateTime.UtcNow)
        {
            return ServiceResult.BadRequest("Etkinlik basladiktan sonra ayrilma islemi yapılamaz.");
        }

        var registration = _dbContext.Registrations
            .FirstOrDefault(item => item.EventId == eventId && item.UserId == currentUserId);

        if (registration is null)
        {
            return ServiceResult.NotFound("Kayıt bulunamadı.");
        }

        _dbContext.Registrations.Remove(registration);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public IReadOnlyList<RegistrationResponse> GetByEventId(int eventId) => _dbContext.Registrations
        .AsNoTracking()
        .Include(registration => registration.User)
        .Include(registration => registration.Event)
        .Where(registration => registration.EventId == eventId)
        .Select(Map)
        .ToList();

    public ServiceResult<RegistrationResponse> Decide(int registrationId, string decision, int currentUserId, string currentUserRole)
    {
        if (!string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult<RegistrationResponse>.Forbidden("Kayıt kararı verme yetkiniz yok.");
        }

        var registration = _dbContext.Registrations
            .Include(item => item.Event)
            .Include(item => item.User)
            .FirstOrDefault(item => item.Id == registrationId);

        if (registration is null || registration.Event is null)
        {
            return ServiceResult<RegistrationResponse>.NotFound("Kayıt bulunamadı.");
        }

        if (string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            var currentUser = _dbContext.Users.AsNoTracking().FirstOrDefault(item => item.Id == currentUserId);
            if (currentUser?.ClubId != registration.Event.ClubId)
            {
                return ServiceResult<RegistrationResponse>.Forbidden("Sadece kendi kulübünüzün başvurularını yönetebilirsiniz.");
            }
        }

        var normalizedDecision = string.Equals(decision, "approve", StringComparison.OrdinalIgnoreCase) ? "Approved" : "Rejected";
        if (normalizedDecision == "Approved")
        {
            var approvedCount = _dbContext.Registrations.Count(item => item.EventId == registration.EventId && item.Status == "Approved" && item.Id != registration.Id);
            if (approvedCount >= registration.Event.Capacity)
            {
                return ServiceResult<RegistrationResponse>.BadRequest("Etkinlik kontenjani dolu.");
            }
        }

        registration.Status = normalizedDecision;
        _dbContext.SaveChanges();

        _notificationService.CreateForUsers([registration.UserId], normalizedDecision == "Approved" ? "Başvurunuz onaylandı" : "Başvurunuz reddedildi", $"{registration.Event.Title} için katılım başvurunuz {normalizedDecision.ToLower()}.", "Registration", $"/events/{registration.EventId}");

        var refreshed = _dbContext.Registrations.AsNoTracking().Include(item => item.User).Include(item => item.Event).First(item => item.Id == registrationId);
        return ServiceResult<RegistrationResponse>.Ok(Map(refreshed));
    }

    private static RegistrationResponse Map(Registration registration) => new()
    {
        Id = registration.Id,
        UserId = registration.UserId,
        EventId = registration.EventId,
        RegisteredAt = registration.RegisteredAt,
        Status = registration.Status,
        Attended = registration.Attended,
        UserFullName = registration.User != null ? registration.User.FullName : string.Empty,
        EventTitle = registration.Event != null ? registration.Event.Title : string.Empty
    };
}
