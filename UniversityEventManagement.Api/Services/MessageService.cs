using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class MessageService : IMessageService
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public MessageService(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    public IReadOnlyList<MessageThreadResponse> GetThreads(int currentUserId, string currentUserRole)
    {
        var query = QueryThreads();

        if (string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(thread => thread.StudentId == currentUserId);
        }
        else if (string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            var currentUser = _dbContext.Users.AsNoTracking().FirstOrDefault(user => user.Id == currentUserId);
            if (currentUser?.ClubId is int clubId)
            {
                query = query.Where(thread => thread.ClubId == clubId);
            }
            else
            {
                return [];
            }
        }

        return query
            .OrderByDescending(thread => thread.UpdatedAt)
            .ToList()
            .Select(thread => MapThread(thread, currentUserId))
            .ToList();
    }

    public ServiceResult<MessageThreadResponse> GetThread(int threadId, int currentUserId, string currentUserRole)
    {
        var thread = QueryThreads().FirstOrDefault(item => item.Id == threadId);
        if (thread is null)
        {
            return ServiceResult<MessageThreadResponse>.NotFound("Mesajlasma bulunamadi.");
        }

        if (!CanAccessThread(thread, currentUserId, currentUserRole))
        {
            return ServiceResult<MessageThreadResponse>.Forbidden("Bu sohbete erisim yetkiniz yok.");
        }

        MarkThreadAsRead(threadId, currentUserId);

        var refreshedThread = QueryThreads().First(item => item.Id == threadId);
        return ServiceResult<MessageThreadResponse>.Ok(MapThread(refreshedThread, currentUserId));
    }

    public ServiceResult<MessageThreadResponse> CreateThread(CreateMessageThreadRequest request, int currentUserId, string currentUserRole)
    {
        if (!string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult<MessageThreadResponse>.Forbidden("Yeni sohbet baslatma hakki yalnizca ogrencilere aciktir.");
        }

        var club = _dbContext.Clubs.AsNoTracking().FirstOrDefault(item => item.Id == request.ClubId);
        if (club is null)
        {
            return ServiceResult<MessageThreadResponse>.NotFound("Kulup bulunamadi.");
        }

        var thread = new MessageThread
        {
            ClubId = request.ClubId,
            StudentId = currentUserId,
            Subject = request.Subject.Trim(),
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.MessageThreads.Add(thread);
        _dbContext.SaveChanges();

        var message = new Message
        {
            ThreadId = thread.Id,
            SenderUserId = currentUserId,
            Body = request.InitialMessage.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Messages.Add(message);
        UpsertReadState(thread.Id, currentUserId, DateTime.UtcNow);
        _dbContext.SaveChanges();

        var recipientIds = _dbContext.ClubMemberships
            .AsNoTracking()
            .Where(membership => membership.ClubId == request.ClubId && membership.Status == "Active" && membership.Role != "Member")
            .Select(membership => membership.UserId)
            .ToList();

        _notificationService.CreateForUsers(recipientIds, "Yeni kulup mesaji", $"{club.Name} icin yeni bir sohbet baslatildi.", "Message", $"/messages?thread={thread.Id}");

        return ServiceResult<MessageThreadResponse>.Created(MapThread(QueryThreads().First(item => item.Id == thread.Id), currentUserId));
    }

    public ServiceResult<MessageThreadResponse> SendMessage(int threadId, SendMessageRequest request, int currentUserId, string currentUserRole)
    {
        var thread = _dbContext.MessageThreads.FirstOrDefault(item => item.Id == threadId);
        if (thread is null)
        {
            return ServiceResult<MessageThreadResponse>.NotFound("Sohbet bulunamadi.");
        }

        var hydratedThread = QueryThreads().First(item => item.Id == threadId);
        if (!CanAccessThread(hydratedThread, currentUserId, currentUserRole))
        {
            return ServiceResult<MessageThreadResponse>.Forbidden("Bu sohbete mesaj gonderemezsiniz.");
        }

        var message = new Message
        {
            ThreadId = threadId,
            SenderUserId = currentUserId,
            Body = request.Body.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Messages.Add(message);
        thread.UpdatedAt = DateTime.UtcNow;
        UpsertReadState(threadId, currentUserId, DateTime.UtcNow);
        _dbContext.SaveChanges();

        var recipientIds = string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase)
            ? _dbContext.ClubMemberships
                .AsNoTracking()
                .Where(membership => membership.ClubId == thread.ClubId && membership.Status == "Active" && membership.Role != "Member")
                .Select(membership => membership.UserId)
                .ToList()
            : [thread.StudentId];

        _notificationService.CreateForUsers(recipientIds, "Yeni mesaj", "Sohbetinizde yeni bir mesaj var.", "Message", $"/messages?thread={threadId}");

        return ServiceResult<MessageThreadResponse>.Ok(MapThread(QueryThreads().First(item => item.Id == threadId), currentUserId));
    }

    private bool CanAccessThread(MessageThread thread, int currentUserId, string currentUserRole)
    {
        if (string.Equals(currentUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(currentUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return thread.StudentId == currentUserId;
        }

        if (!string.Equals(currentUserRole, "ClubManager", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var currentUser = _dbContext.Users.AsNoTracking().FirstOrDefault(user => user.Id == currentUserId);
        return currentUser?.ClubId == thread.ClubId;
    }

    private IQueryable<MessageThread> QueryThreads() => _dbContext.MessageThreads
        .AsNoTracking()
        .Include(thread => thread.Club)
        .Include(thread => thread.Student)
        .Include(thread => thread.Messages)
            .ThenInclude(message => message.SenderUser)
        .Include(thread => thread.ReadStates);

    private void MarkThreadAsRead(int threadId, int currentUserId)
    {
        var now = DateTime.UtcNow;
        UpsertReadState(threadId, currentUserId, now);

        var unreadMessages = _dbContext.Messages
            .Where(message => message.ThreadId == threadId && message.SenderUserId != currentUserId && message.ReadAt == null)
            .ToList();

        if (unreadMessages.Count != 0)
        {
            foreach (var message in unreadMessages)
            {
                message.ReadAt = now;
            }
        }

        _dbContext.SaveChanges();
    }

    private void UpsertReadState(int threadId, int currentUserId, DateTime readAt)
    {
        var existingState = _dbContext.MessageThreadReadStates
            .FirstOrDefault(state => state.ThreadId == threadId && state.UserId == currentUserId);

        if (existingState is null)
        {
            _dbContext.MessageThreadReadStates.Add(new MessageThreadReadState
            {
                ThreadId = threadId,
                UserId = currentUserId,
                LastReadAt = readAt
            });
            return;
        }

        existingState.LastReadAt = readAt;
    }

    private static MessageThreadResponse MapThread(MessageThread thread, int currentUserId)
    {
        var orderedMessages = thread.Messages.OrderBy(message => message.CreatedAt).ToList();
        var readState = thread.ReadStates.FirstOrDefault(state => state.UserId == currentUserId);
        var lastReadAt = readState?.LastReadAt;
        var unreadCount = orderedMessages.Count(message =>
            message.SenderUserId != currentUserId &&
            (!lastReadAt.HasValue || message.CreatedAt > lastReadAt.Value));

        return new MessageThreadResponse
        {
            Id = thread.Id,
            ClubId = thread.ClubId,
            ClubName = thread.Club?.Name ?? string.Empty,
            ClubAvatarUrl = thread.Club?.AvatarUrl ?? string.Empty,
            StudentId = thread.StudentId,
            StudentName = thread.Student?.FullName ?? string.Empty,
            Subject = thread.Subject,
            Status = thread.Status,
            LastMessagePreview = orderedMessages.LastOrDefault()?.Body ?? string.Empty,
            UnreadCount = unreadCount,
            UpdatedAt = thread.UpdatedAt,
            Messages = orderedMessages.Select(message => new MessageResponse
            {
                Id = message.Id,
                ThreadId = message.ThreadId,
                SenderUserId = message.SenderUserId,
                SenderName = message.SenderUser?.FullName ?? string.Empty,
                Body = message.Body,
                CreatedAt = message.CreatedAt,
                IsUnreadForCurrentUser = message.SenderUserId != currentUserId &&
                    (!lastReadAt.HasValue || message.CreatedAt > lastReadAt.Value)
            }).ToList()
        };
    }
}
