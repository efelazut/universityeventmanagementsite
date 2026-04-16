using Microsoft.EntityFrameworkCore;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        if (await dbContext.Users.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;
        var clubs = CreateClubs();
        dbContext.Clubs.AddRange(clubs);
        await dbContext.SaveChangesAsync();

        var rooms = CreateRooms();
        dbContext.Rooms.AddRange(rooms);
        await dbContext.SaveChangesAsync();

        var users = CreateUsers(clubs);
        dbContext.Users.AddRange(users);
        await dbContext.SaveChangesAsync();

        var memberships = CreateMemberships(clubs, users, now);
        dbContext.ClubMemberships.AddRange(memberships);
        await dbContext.SaveChangesAsync();

        PromoteAssistantsToManagers(clubs, users);
        await dbContext.SaveChangesAsync();

        var events = CreateEvents(now, clubs, rooms);
        dbContext.Events.AddRange(events);
        await dbContext.SaveChangesAsync();

        var registrations = CreateRegistrations(now, users, events);
        dbContext.Registrations.AddRange(registrations);
        await dbContext.SaveChangesAsync();

        var reviews = CreateReviews(now, users, events);
        dbContext.EventReviews.AddRange(reviews);
        await dbContext.SaveChangesAsync();

        var notifications = CreateNotifications(now, users, events);
        dbContext.Notifications.AddRange(notifications);
        await dbContext.SaveChangesAsync();

        var threads = CreateThreads(now, clubs, users);
        dbContext.MessageThreads.AddRange(threads);
        await dbContext.SaveChangesAsync();

        var messages = CreateMessages(now, threads, users);
        dbContext.Messages.AddRange(messages);
        await dbContext.SaveChangesAsync();

        var readStates = CreateReadStates(now, threads, users);
        dbContext.MessageThreadReadStates.AddRange(readStates);
        await dbContext.SaveChangesAsync();
    }
}
