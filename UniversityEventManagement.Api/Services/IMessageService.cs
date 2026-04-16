using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IMessageService
{
    IReadOnlyList<MessageThreadResponse> GetThreads(int currentUserId, string currentUserRole);
    ServiceResult<MessageThreadResponse> GetThread(int threadId, int currentUserId, string currentUserRole);
    ServiceResult<MessageThreadResponse> CreateThread(CreateMessageThreadRequest request, int currentUserId, string currentUserRole);
    ServiceResult<MessageThreadResponse> SendMessage(int threadId, SendMessageRequest request, int currentUserId, string currentUserRole);
}
