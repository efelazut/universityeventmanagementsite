using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class RoomService : IRoomService
{
    private readonly AppDbContext _dbContext;

    public RoomService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<RoomResponse> GetAll() => _dbContext.Rooms
        .AsNoTracking()
        .ToList()
        .Select(Map)
        .ToList();

    public ServiceResult<RoomResponse> GetById(int id)
    {
        var room = _dbContext.Rooms
            .AsNoTracking()
            .FirstOrDefault(item => item.Id == id);

        return room is null
            ? ServiceResult<RoomResponse>.NotFound()
            : ServiceResult<RoomResponse>.Ok(Map(room));
    }

    public ServiceResult<RoomResponse> Create(RoomRequest request)
    {
        var normalizedName = request.Name.Trim();
        var normalizedBuilding = request.Building.Trim();
        var duplicateRoom = _dbContext.Rooms.Any(room =>
            room.Name.ToLower() == normalizedName.ToLower() &&
            room.Building.ToLower() == normalizedBuilding.ToLower());

        if (duplicateRoom)
        {
            return ServiceResult<RoomResponse>.Conflict("Room already exists in the same building.");
        }

        var createdRoom = new Room
        {
            Name = normalizedName,
            Building = normalizedBuilding,
            Type = request.Type.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Capacity = request.Capacity,
            IsAvailable = request.IsAvailable
        };

        _dbContext.Rooms.Add(createdRoom);
        _dbContext.SaveChanges();

        return ServiceResult<RoomResponse>.Created(Map(createdRoom));
    }

    public ServiceResult<RoomResponse> Update(int id, RoomRequest request)
    {
        var room = _dbContext.Rooms.FirstOrDefault(item => item.Id == id);
        if (room is null)
        {
            return ServiceResult<RoomResponse>.NotFound();
        }

        var normalizedName = request.Name.Trim();
        var normalizedBuilding = request.Building.Trim();
        var duplicateRoom = _dbContext.Rooms
            .AsNoTracking()
            .Any(item =>
                item.Id != id &&
                item.Name.ToLower() == normalizedName.ToLower() &&
                item.Building.ToLower() == normalizedBuilding.ToLower());

        if (duplicateRoom)
        {
            return ServiceResult<RoomResponse>.Conflict("Room already exists in the same building.");
        }

        room.Name = normalizedName;
        room.Building = normalizedBuilding;
        room.Type = request.Type.Trim();
        room.Description = request.Description?.Trim() ?? string.Empty;
        room.Capacity = request.Capacity;
        room.IsAvailable = request.IsAvailable;

        _dbContext.SaveChanges();

        return ServiceResult<RoomResponse>.Ok(Map(room));
    }

    public ServiceResult Delete(int id)
    {
        var room = _dbContext.Rooms.FirstOrDefault(item => item.Id == id);
        if (room is null)
        {
            return ServiceResult.NotFound();
        }

        if (_dbContext.Events.Any(@event => @event.RoomId == id))
        {
            return ServiceResult.Conflict("Cannot delete a room that is used by events.");
        }

        _dbContext.Rooms.Remove(room);
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public IReadOnlyList<RoomAvailabilityResponse> GetAvailability()
    {
        var now = DateTime.UtcNow;
        var rooms = _dbContext.Rooms.AsNoTracking().ToList();
        var events = _dbContext.Events.AsNoTracking().ToList();

        return rooms
            .Select(room =>
            {
                var nextEvent = events
                    .Where(@event => @event.RoomId == room.Id && @event.StartDate >= now)
                    .OrderBy(@event => @event.StartDate)
                    .FirstOrDefault();

                var activeEvent = events
                    .FirstOrDefault(@event => @event.RoomId == room.Id && @event.StartDate <= now && @event.EndDate >= now);

                var statusLabel = activeEvent is not null
                    ? "Dolu"
                    : nextEvent is not null
                        ? "Etkinlik Planlandi"
                        : room.IsAvailable
                            ? "Bos"
                            : "Dolu";
                var todayReservations = events.Count(@event => @event.RoomId == room.Id && @event.StartDate.Date == now.Date);
                var dailySummary = todayReservations == 0
                    ? "Bugün tamamen boş"
                    : todayReservations == 1
                        ? "Bugün 1 rezervasyon"
                        : todayReservations <= 3
                            ? $"Bugün {todayReservations} rezervasyon"
                            : "Bugün kısmi yoğun";

                return new RoomAvailabilityResponse
                {
                    RoomId = room.Id,
                    RoomName = room.Name,
                    Building = room.Building,
                    IsAvailable = room.IsAvailable && nextEvent is null && activeEvent is null,
                    NextOccupiedStartDate = nextEvent?.StartDate,
                    StatusLabel = dailySummary,
                    NextEventTitle = activeEvent?.Title ?? nextEvent?.Title
                };
            })
            .OrderByDescending(item => item.IsAvailable)
            .ThenBy(item => item.RoomName)
            .ToList();
    }

    public IReadOnlyList<RoomPopularityResponse> GetPopularity()
    {
        var eventCounts = _dbContext.Events
            .AsNoTracking()
            .GroupBy(@event => @event.RoomId)
            .ToDictionary(group => group.Key, group => group.Count());

        return _dbContext.Rooms
            .AsNoTracking()
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
            .ThenBy(item => item.RoomName)
            .ToList();
    }

    public ServiceResult<RoomDayAvailabilityResponse> GetDayAvailability(int roomId, DateTime date)
    {
        var room = _dbContext.Rooms.AsNoTracking().FirstOrDefault(item => item.Id == roomId);
        if (room is null)
        {
            return ServiceResult<RoomDayAvailabilityResponse>.NotFound("Salon bulunamadı.");
        }

        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);
        var events = _dbContext.Events
            .AsNoTracking()
            .Where(@event => @event.RoomId == roomId && @event.StartDate < dayEnd && @event.EndDate > dayStart)
            .OrderBy(@event => @event.StartDate)
            .ToList();

        var slots = Enumerable.Range(9, 10)
            .Select(hour =>
            {
                var slotStart = dayStart.AddHours(hour);
                var slotEnd = slotStart.AddHours(1);
                var occupyingEvent = events.FirstOrDefault(@event => @event.StartDate < slotEnd && @event.EndDate > slotStart);
                return new RoomTimeSlotResponse
                {
                    StartTime = slotStart.ToString("HH:mm"),
                    EndTime = slotEnd.ToString("HH:mm"),
                    IsAvailable = occupyingEvent is null,
                    Label = occupyingEvent?.Title ?? "Uygun"
                };
            })
            .ToList();

        return ServiceResult<RoomDayAvailabilityResponse>.Ok(new RoomDayAvailabilityResponse
        {
            Id = room.Id,
            RoomId = room.Id,
            RoomName = room.Name,
            Date = dayStart,
            HasAvailability = slots.Any(slot => slot.IsAvailable),
            Slots = slots
        });
    }

    private static RoomResponse Map(Room room) => new()
    {
        Id = room.Id,
        Name = room.Name,
        Building = room.Building,
        Type = room.Type,
        Description = room.Description,
        Capacity = room.Capacity,
        IsAvailable = room.IsAvailable
    };
}
