using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface INotificationService
{
    IReadOnlyList<NotificationResponse> GetForUser(int userId);
    ServiceResult MarkAsRead(int notificationId, int userId);
    ServiceResult MarkAllAsRead(int userId);
    void CreateForUsers(IEnumerable<int> userIds, string title, string message, string type, string relatedLink = "");
}
