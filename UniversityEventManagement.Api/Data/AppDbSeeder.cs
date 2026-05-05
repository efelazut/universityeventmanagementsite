using Microsoft.EntityFrameworkCore;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        if (await dbContext.Users.AnyAsync())
        {
            await RestoreMissingDemoDataAsync(dbContext);
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

    private static async Task RestoreMissingDemoDataAsync(AppDbContext dbContext)
    {
        var clubs = await dbContext.Clubs.OrderBy(club => club.Id).ToArrayAsync();
        var rooms = await dbContext.Rooms.OrderBy(room => room.Id).ToArrayAsync();
        var users = await dbContext.Users.OrderBy(user => user.Id).ToArrayAsync();

        if (clubs.Length < 4 || rooms.Length < 8 || users.Length < 12)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var events = await dbContext.Events.OrderBy(@event => @event.Id).ToListAsync();

        if (events.Count == 0)
        {
            events = CreateEvents(now, clubs, rooms);
            dbContext.Events.AddRange(events);
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.Registrations.AnyAsync())
        {
            dbContext.Registrations.AddRange(CreateRegistrations(now, users, events));
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.EventReviews.AnyAsync())
        {
            dbContext.EventReviews.AddRange(CreateReviews(now, users, events));
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.Notifications.AnyAsync())
        {
            dbContext.Notifications.AddRange(CreateNotifications(now, users, events));
            await dbContext.SaveChangesAsync();
        }

        var threads = await dbContext.MessageThreads.OrderBy(thread => thread.Id).ToListAsync();

        if (threads.Count == 0)
        {
            threads = CreateThreads(now, clubs, users);
            dbContext.MessageThreads.AddRange(threads);
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.Messages.AnyAsync())
        {
            dbContext.Messages.AddRange(CreateMessages(now, threads, users));
            await dbContext.SaveChangesAsync();
        }

        if (!await dbContext.MessageThreadReadStates.AnyAsync())
        {
            dbContext.MessageThreadReadStates.AddRange(CreateReadStates(now, threads, users));
            await dbContext.SaveChangesAsync();
        }
    }
}
