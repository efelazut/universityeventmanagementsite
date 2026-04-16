using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class EventService : IEventService
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public EventService(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public IReadOnlyList<EventResponse> GetAll() => QueryEvents()
        .ToList()
        .Select(MapEventResponse)
        .ToList();

    public ServiceResult<EventResponse> GetById(int id)
    {
        var @event = QueryEvents().FirstOrDefault(item => item.Id == id);
        return @event is null
            ? ServiceResult<EventResponse>.NotFound()
            : ServiceResult<EventResponse>.Ok(MapEventResponse(@event));
    }

    public ServiceResult<EventResponse> Create(EventRequest request, int currentUserId, string currentUserRole)
    {
        var currentUserResult = GetAuthorizedUser(currentUserId, currentUserRole);
        if (currentUserResult.Error is not null)
        {
            return currentUserResult.Error;
        }

        var normalizedClubId = ResolveClubIdForWrite(request.ClubId, currentUserResult.User!);
        if (!normalizedClubId.HasValue)
        {
            return string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase)
                ? ServiceResult<EventResponse>.BadRequest("Kulup bilgisi zorunludur.")
                : ServiceResult<EventResponse>.Forbidden("Kulup yoneticisinin bagli oldugu bir kulup olmalidir.");
        }

        var validation = ValidateRelationshipsAndConflicts(request, null, normalizedClubId.Value);
        if (validation is not null)
        {
            return validation;
        }

        var createdEvent = new Event
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Category = request.Category?.Trim() ?? string.Empty,
            Campus = request.Campus?.Trim() ?? string.Empty,
            Format = request.Format?.Trim() ?? "Fiziksel",
            ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
            LocationDetails = request.LocationDetails?.Trim() ?? string.Empty,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Capacity = request.Capacity,
            RequiresApproval = request.RequiresApproval,
            IsFree = request.IsFree,
            Price = request.IsFree ? 0 : request.Price,
            ClubId = normalizedClubId.Value,
            RoomId = request.RoomId,
            PosterCost = request.PosterCost,
            CateringCost = request.CateringCost,
            SpeakerFee = request.SpeakerFee,
            Status = NormalizeStatus(request.Status, request.StartDate, request.EndDate),
            ActualAttendanceCount = request.ActualAttendanceCount
        };

        _dbContext.Events.Add(createdEvent);
        _dbContext.SaveChanges();

        var recipientIds = _dbContext.ClubMemberships
            .AsNoTracking()
            .Where(membership => membership.ClubId == createdEvent.ClubId && membership.Status == "Active" && membership.Role == "Member")
            .Select(membership => membership.UserId)
            .ToList();

        _notificationService.CreateForUsers(recipientIds, "Yeni etkinlik yayinda", $"{createdEvent.Title} etkinligi kulup takvimine eklendi.", "Event", $"/events/{createdEvent.Id}");

        var responseEvent = QueryEvents().First(@event => @event.Id == createdEvent.Id);
        return ServiceResult<EventResponse>.Created(MapEventResponse(responseEvent));
    }

    public ServiceResult<EventResponse> Update(int id, EventRequest request, int currentUserId, string currentUserRole)
    {
        var existingEvent = _dbContext.Events.FirstOrDefault(@event => @event.Id == id);
        if (existingEvent is null)
        {
            return ServiceResult<EventResponse>.NotFound();
        }

        var currentUserResult = GetAuthorizedUser(currentUserId, currentUserRole);
        if (currentUserResult.Error is not null)
        {
            return currentUserResult.Error;
        }

        if (!CanManageEvent(currentUserResult.User!, existingEvent, currentUserRole))
        {
            return ServiceResult<EventResponse>.Forbidden("Yalnizca kendi kulubunuze ait etkinlikleri guncelleyebilirsiniz.");
        }

        var normalizedClubId = ResolveClubIdForWrite(request.ClubId, currentUserResult.User!);
        if (!normalizedClubId.HasValue)
        {
            return string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase)
                ? ServiceResult<EventResponse>.BadRequest("Kulup bilgisi zorunludur.")
                : ServiceResult<EventResponse>.Forbidden("Kulup yoneticisinin bagli oldugu bir kulup olmalidir.");
        }

        var validation = ValidateRelationshipsAndConflicts(request, id, normalizedClubId.Value);
        if (validation is not null)
        {
            return validation;
        }

        existingEvent.Title = request.Title.Trim();
        existingEvent.Description = request.Description?.Trim() ?? string.Empty;
        existingEvent.Category = request.Category?.Trim() ?? string.Empty;
        existingEvent.Campus = request.Campus?.Trim() ?? string.Empty;
        existingEvent.Format = request.Format?.Trim() ?? "Fiziksel";
        existingEvent.ImageUrl = request.ImageUrl?.Trim() ?? string.Empty;
        existingEvent.LocationDetails = request.LocationDetails?.Trim() ?? string.Empty;
        existingEvent.StartDate = request.StartDate;
        existingEvent.EndDate = request.EndDate;
        existingEvent.Capacity = request.Capacity;
        existingEvent.RequiresApproval = request.RequiresApproval;
        existingEvent.IsFree = request.IsFree;
        existingEvent.Price = request.IsFree ? 0 : request.Price;
        existingEvent.ClubId = normalizedClubId.Value;
        existingEvent.RoomId = request.RoomId;
        existingEvent.PosterCost = request.PosterCost;
        existingEvent.CateringCost = request.CateringCost;
        existingEvent.SpeakerFee = request.SpeakerFee;
        existingEvent.Status = NormalizeStatus(request.Status, request.StartDate, request.EndDate);
        existingEvent.ActualAttendanceCount = request.ActualAttendanceCount;

        _dbContext.SaveChanges();

        var recipientIds = _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.EventId == id)
            .Select(registration => registration.UserId)
            .ToList();

        _notificationService.CreateForUsers(recipientIds, "Etkinlik guncellendi", $"{existingEvent.Title} icin tarih veya icerik bilgisi guncellendi.", "Event", $"/events/{existingEvent.Id}");

        var responseEvent = QueryEvents().First(@event => @event.Id == id);
        return ServiceResult<EventResponse>.Ok(MapEventResponse(responseEvent));
    }

    public ServiceResult Delete(int id, int currentUserId, string currentUserRole)
    {
        var @event = _dbContext.Events.FirstOrDefault(item => item.Id == id);
        if (@event is null)
        {
            return ServiceResult.NotFound();
        }

        if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return DeleteEventGraph(@event);
        }

        if (!string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult.Forbidden("Bu etkinligi silme yetkiniz yok.");
        }

        var currentUser = _dbContext.Users.FirstOrDefault(user => user.Id == currentUserId);
        if (currentUser is null)
        {
            return ServiceResult.Unauthorized("Kullanici dogrulanamadi.");
        }

        if (!CanManageEvent(currentUser, @event, currentUserRole))
        {
            return ServiceResult.Forbidden("Yalnizca kendi kulubunuze ait etkinlikleri silebilirsiniz.");
        }

        return DeleteEventGraph(@event);
    }

    public IReadOnlyList<EventResponse> GetPast()
    {
        var now = DateTime.UtcNow;
        return QueryEvents()
            .Where(@event => @event.EndDate < now || @event.Status == "Cancelled")
            .ToList()
            .Select(MapEventResponse)
            .ToList();
    }

    public IReadOnlyList<EventResponse> GetUpcoming()
    {
        var now = DateTime.UtcNow;
        return QueryEvents()
            .Where(@event => @event.StartDate >= now && @event.Status != "Cancelled")
            .ToList()
            .Select(MapEventResponse)
            .ToList();
    }

    public ServiceResult<IReadOnlyList<RegistrationResponse>> GetRegistrations(int id)
    {
        if (!_dbContext.Events.Any(@event => @event.Id == id))
        {
            return ServiceResult<IReadOnlyList<RegistrationResponse>>.NotFound();
        }

        var registrations = _dbContext.Registrations
            .AsNoTracking()
            .Include(registration => registration.User)
            .Include(registration => registration.Event)
            .Where(registration => registration.EventId == id)
            .ToList()
            .Select(MapRegistration)
            .ToList();

        return ServiceResult<IReadOnlyList<RegistrationResponse>>.Ok(registrations);
    }

    public ServiceResult<AttendanceResponse> MarkAttendance(int eventId, int userId)
    {
        var @event = _dbContext.Events.FirstOrDefault(item => item.Id == eventId);
        if (@event is null)
        {
            return ServiceResult<AttendanceResponse>.NotFound("Etkinlik bulunamadi.");
        }

        if (@event.EndDate > DateTime.UtcNow)
        {
            return ServiceResult<AttendanceResponse>.BadRequest("Etkinlik tamamlanmadan yoklama islenemez.");
        }

        var registration = _dbContext.Registrations
            .FirstOrDefault(existingRegistration => existingRegistration.EventId == eventId && existingRegistration.UserId == userId);

        if (registration is null)
        {
            return ServiceResult<AttendanceResponse>.NotFound("Kayit bulunamadi.");
        }

        if (registration.Status != "Approved")
        {
            return ServiceResult<AttendanceResponse>.BadRequest("Onaylanmamis kayitlar icin yoklama islenemez.");
        }

        if (!registration.Attended)
        {
            registration.Attended = true;
            @event.ActualAttendanceCount += 1;
            _dbContext.SaveChanges();
        }

        return ServiceResult<AttendanceResponse>.Ok(new AttendanceResponse
        {
            EventId = eventId,
            UserId = userId,
            Attended = registration.Attended,
            ActualAttendanceCount = @event.ActualAttendanceCount
        });
    }

    private ServiceResult DeleteEventGraph(Event @event)
    {
        var reviews = _dbContext.EventReviews.Where(review => review.EventId == @event.Id).ToList();
        var registrations = _dbContext.Registrations.Where(registration => registration.EventId == @event.Id).ToList();

        if (reviews.Count != 0)
        {
            _dbContext.EventReviews.RemoveRange(reviews);
        }

        if (registrations.Count != 0)
        {
            _dbContext.Registrations.RemoveRange(registrations);
        }

        _dbContext.Events.Remove(@event);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    private ServiceResult<EventResponse>? ValidateRelationshipsAndConflicts(EventRequest request, int? currentEventId, int clubId)
    {
        if (!_dbContext.Rooms.Any(room => room.Id == request.RoomId))
        {
            return ServiceResult<EventResponse>.NotFound("Salon bulunamadi.");
        }

        if (!_dbContext.Clubs.Any(club => club.Id == clubId))
        {
            return ServiceResult<EventResponse>.NotFound("Kulup bulunamadi.");
        }

        if (request.EndDate <= request.StartDate)
        {
            return ServiceResult<EventResponse>.BadRequest("Bitis tarihi baslangic tarihinden sonra olmalidir.");
        }

        var roomConflict = _dbContext.Events.Any(existingEvent =>
            existingEvent.RoomId == request.RoomId &&
            existingEvent.StartDate < request.EndDate &&
            existingEvent.EndDate > request.StartDate &&
            existingEvent.Status != "Cancelled" &&
            (!currentEventId.HasValue || existingEvent.Id != currentEventId.Value));

        return roomConflict
            ? ServiceResult<EventResponse>.BadRequest("Bu saat araliginda salon zaten dolu.")
            : null;
    }

    private static bool CanManageEvent(User currentUser, Event @event, string currentUserRole)
    {
        if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase)
            && currentUser.ClubId.HasValue
            && currentUser.ClubId.Value == @event.ClubId;
    }

    private static int? ResolveClubIdForWrite(int? requestedClubId, User currentUser)
    {
        if (string.Equals(currentUser.Role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return requestedClubId;
        }

        if (!string.Equals(currentUser.Role, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return currentUser.ClubId;
    }

    private (User? User, ServiceResult<EventResponse>? Error) GetAuthorizedUser(int currentUserId, string currentUserRole)
    {
        var currentUser = _dbContext.Users.FirstOrDefault(user => user.Id == currentUserId);
        if (currentUser is null)
        {
            return (null, ServiceResult<EventResponse>.Unauthorized("Kullanici dogrulanamadi."));
        }

        if (!string.Equals(currentUser.Role, currentUserRole, StringComparison.OrdinalIgnoreCase))
        {
            return (null, ServiceResult<EventResponse>.Unauthorized("Kullanici rolu dogrulanamadi."));
        }

        if (string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase) && !currentUser.ClubId.HasValue)
        {
            return (null, ServiceResult<EventResponse>.Forbidden("Kulup yoneticisinin bagli oldugu bir kulup olmalidir."));
        }

        return (currentUser, null);
    }

    private IQueryable<Event> QueryEvents() => _dbContext.Events
        .AsNoTracking()
        .Include(@event => @event.Club)
        .Include(@event => @event.Room)
        .Include(@event => @event.Registrations)
        .Include(@event => @event.Reviews);

    internal static string ComputeStatus(Event @event)
    {
        if (string.Equals(@event.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return "Cancelled";
        }

        var now = DateTime.UtcNow;
        if (@event.StartDate <= now && @event.EndDate >= now)
        {
            return "Ongoing";
        }

        if (@event.EndDate < now)
        {
            return "Completed";
        }

        return "Upcoming";
    }

    internal static string NormalizeStatus(string status, DateTime startDate, DateTime endDate)
    {
        if (string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return "Cancelled";
        }

        var now = DateTime.UtcNow;
        if (startDate <= now && endDate >= now)
        {
            return "Ongoing";
        }

        if (endDate < now)
        {
            return "Completed";
        }

        return "Upcoming";
    }

    internal static EventResponse MapEventResponse(Event @event) => new()
    {
        Id = @event.Id,
        Title = @event.Title,
        Description = @event.Description,
        Category = @event.Category,
        Campus = @event.Campus,
        Format = @event.Format,
        ImageUrl = @event.ImageUrl,
        LocationDetails = @event.LocationDetails,
        StartDate = @event.StartDate,
        EndDate = @event.EndDate,
        Capacity = @event.Capacity,
        RequiresApproval = @event.RequiresApproval,
        IsFree = @event.IsFree,
        Price = @event.Price,
        ClubId = @event.ClubId,
        ClubName = @event.Club?.Name ?? string.Empty,
        ClubEmail = @event.Club?.PresidentEmail ?? string.Empty,
        ClubAvatarUrl = @event.Club?.AvatarUrl ?? string.Empty,
        RoomId = @event.RoomId,
        RoomName = @event.Room?.Name ?? string.Empty,
        Building = @event.Room?.Building ?? string.Empty,
        PosterCost = @event.PosterCost,
        CateringCost = @event.CateringCost,
        SpeakerFee = @event.SpeakerFee,
        TotalCost = @event.PosterCost + @event.CateringCost + @event.SpeakerFee,
        Status = @event.Status,
        ComputedStatus = ComputeStatus(@event),
        ActualAttendanceCount = @event.ActualAttendanceCount,
        RegistrationCount = @event.Registrations.Count,
        ApprovedRegistrationCount = @event.Registrations.Count(registration => registration.Status == "Approved"),
        PendingRegistrationCount = @event.Registrations.Count(registration => registration.Status == "Pending"),
        AverageRating = @event.Reviews.Count == 0 ? 0 : @event.Reviews.Average(review => review.Rating),
        ReviewCount = @event.Reviews.Count
    };

    private static RegistrationResponse MapRegistration(Registration registration) => new()
    {
        Id = registration.Id,
        EventId = registration.EventId,
        UserId = registration.UserId,
        RegisteredAt = registration.RegisteredAt,
        Status = registration.Status,
        Attended = registration.Attended,
        UserFullName = registration.User?.FullName ?? string.Empty,
        EventTitle = registration.Event?.Title ?? string.Empty
    };
}
