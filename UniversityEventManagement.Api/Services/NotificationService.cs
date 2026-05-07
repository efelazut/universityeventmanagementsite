using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;

    public NotificationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<NotificationResponse> GetForUser(int userId) => _dbContext.Notifications
        .AsNoTracking()
        .Where(notification => notification.UserId == userId)
        .OrderByDescending(notification => notification.CreatedAt)
        .Select(notification => new NotificationResponse
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            RelatedLink = notification.RelatedLink,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        })
        .ToList();

    public ServiceResult MarkAsRead(int notificationId, int userId)
    {
        var notification = _dbContext.Notifications.FirstOrDefault(item => item.Id == notificationId && item.UserId == userId);
        if (notification is null)
        {
            return ServiceResult.NotFound("Bildirim bulunamadı.");
        }

        notification.IsRead = true;
        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public ServiceResult MarkAllAsRead(int userId)
    {
        var unreadNotifications = _dbContext.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToList();

        if (unreadNotifications.Count == 0)
        {
            return ServiceResult.Ok();
        }

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        _dbContext.SaveChanges();
        return ServiceResult.Ok();
    }

    public void CreateForUsers(IEnumerable<int> userIds, string title, string message, string type, string relatedLink = "")
    {
        var distinctIds = userIds.Distinct().ToList();
        if (distinctIds.Count == 0)
        {
            return;
        }

        var notifications = distinctIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            RelatedLink = relatedLink,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        _dbContext.Notifications.AddRange(notifications);
        _dbContext.SaveChanges();
    }
}
