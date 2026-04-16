using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Data;

public static partial class AppDbSeeder
{
    private static List<Notification> CreateNotifications(DateTime now, User[] users, List<Event> events) =>
    [
        CreateNotification(users[5].Id, "Yeni etkinlik yayınlandı", $"{events[3].Title} için başvurular açıldı.", "Event", $"/events/{events[3].Id}", now.AddHours(-5), false),
        CreateNotification(users[6].Id, "Başvurunuz onaylandı", $"{events[10].Title} etkinliği için kaydınız onaylandı.", "Registration", $"/events/{events[10].Id}", now.AddHours(-4), false),
        CreateNotification(users[8].Id, "Kulüp duyurusu", $"{events[15].Title} için prova akışı paylaşıldı.", "Club", $"/clubs/{events[15].ClubId}", now.AddHours(-3), true),
        CreateNotification(users[9].Id, "Yeni mesaj", "Bir kulüp yöneticisi mesajınıza yanıt verdi.", "Message", "/messages", now.AddHours(-2), false),
        CreateNotification(users[10].Id, "Etkinlik tarihi güncellendi", $"{events[20].Title} için saat bilgisi güncellendi.", "Event", $"/events/{events[20].Id}", now.AddHours(-1), false)
    ];

    private static List<MessageThread> CreateThreads(DateTime now, Club[] clubs, User[] users) =>
    [
        new() { ClubId = clubs[0].Id, StudentId = users[5].Id, Subject = "Hackathon ekibi hakkında", Status = "Open", CreatedAt = now.AddDays(-2), UpdatedAt = now.AddHours(-2) },
        new() { ClubId = clubs[1].Id, StudentId = users[6].Id, Subject = "Gösterim gecesi için gönüllülük", Status = "Open", CreatedAt = now.AddDays(-1), UpdatedAt = now.AddHours(-5) },
        new() { ClubId = clubs[2].Id, StudentId = users[8].Id, Subject = "Bahar konseri prova sorusu", Status = "Open", CreatedAt = now.AddDays(-1), UpdatedAt = now.AddHours(-1) },
        new() { ClubId = clubs[3].Id, StudentId = users[9].Id, Subject = "Mentor kahvaltısı kontenjanı", Status = "Open", CreatedAt = now.AddDays(-3), UpdatedAt = now.AddHours(-7) }
    ];

    private static List<Message> CreateMessages(DateTime now, List<MessageThread> threads, User[] users) =>
    [
        new() { ThreadId = threads[0].Id, SenderUserId = users[5].Id, Body = "Merhaba, ekip eşleştirmesi etkinlikten önce mi yapılacak?", CreatedAt = now.AddDays(-2).AddHours(2) },
        new() { ThreadId = threads[0].Id, SenderUserId = users[1].Id, Body = "Etkinlikten bir gün önce kısa bir tanışma oturumu açacağız.", CreatedAt = now.AddHours(-2) },
        new() { ThreadId = threads[1].Id, SenderUserId = users[6].Id, Body = "Gösterim akşamında kayıt ekibine destek olmak istiyorum.", CreatedAt = now.AddDays(-1).AddHours(1) },
        new() { ThreadId = threads[1].Id, SenderUserId = users[2].Id, Body = "Harika, seni gönüllü listesine ekliyoruz ve detayları paylaşıyoruz.", CreatedAt = now.AddHours(-5) },
        new() { ThreadId = threads[2].Id, SenderUserId = users[8].Id, Body = "Konser öncesi prova saatini paylaşabilir misiniz?", CreatedAt = now.AddHours(-9) },
        new() { ThreadId = threads[2].Id, SenderUserId = users[3].Id, Body = "Yarın 17.00'de kara kutu sahnesinde prova alacağız.", CreatedAt = now.AddHours(-1) },
        new() { ThreadId = threads[3].Id, SenderUserId = users[9].Id, Body = "Mentor kahvaltısında ek kontenjan olur mu?", CreatedAt = now.AddDays(-2) },
        new() { ThreadId = threads[3].Id, SenderUserId = users[4].Id, Body = "İki kişilik ek kontenjan açıyoruz, kısa süre içinde duyuracağız.", CreatedAt = now.AddHours(-7) }
    ];

    private static List<MessageThreadReadState> CreateReadStates(DateTime now, List<MessageThread> threads, User[] users) =>
    [
        new() { ThreadId = threads[0].Id, UserId = users[5].Id, LastReadAt = now.AddDays(-2).AddHours(2) },
        new() { ThreadId = threads[1].Id, UserId = users[6].Id, LastReadAt = now.AddHours(-5) },
        new() { ThreadId = threads[2].Id, UserId = users[8].Id, LastReadAt = now.AddHours(-9) },
        new() { ThreadId = threads[3].Id, UserId = users[9].Id, LastReadAt = now.AddDays(-2) }
    ];

    private static Notification CreateNotification(int userId, string title, string message, string type, string link, DateTime createdAt, bool isRead) => new()
    {
        UserId = userId,
        Title = title,
        Message = message,
        Type = type,
        RelatedLink = link,
        IsRead = isRead,
        CreatedAt = createdAt
    };
}
