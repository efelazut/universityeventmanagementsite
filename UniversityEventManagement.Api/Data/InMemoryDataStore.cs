using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Data;

public static class InMemoryDataStore
{
    public static InMemoryEntityStore<Club> Clubs { get; } = new(club => club.Id, (club, id) => club.Id = id);
    public static InMemoryEntityStore<Event> Events { get; } = new(@event => @event.Id, (@event, id) => @event.Id = id);
    public static InMemoryEntityStore<Registration> Registrations { get; } = new(registration => registration.Id, (registration, id) => registration.Id = id);
    public static InMemoryEntityStore<Room> Rooms { get; } = new(room => room.Id, (room, id) => room.Id = id);
    public static InMemoryEntityStore<User> Users { get; } = new(user => user.Id, (user, id) => user.Id = id);
}
