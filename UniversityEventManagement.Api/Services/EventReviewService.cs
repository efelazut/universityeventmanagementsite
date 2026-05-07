using Microsoft.EntityFrameworkCore;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;

namespace UniversityEventManagement.Api.Services;

public class EventReviewService : IEventReviewService
{
    private readonly AppDbContext _dbContext;

    public EventReviewService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IReadOnlyList<EventReviewResponse> GetByEventId(int eventId) => _dbContext.EventReviews
        .AsNoTracking()
        .Where(review => review.EventId == eventId)
        .OrderByDescending(review => review.CreatedAt)
        .Select(review => new EventReviewResponse
        {
            Id = review.Id,
            EventId = review.EventId,
            UserId = review.UserId,
            UserFullName = review.User != null ? review.User.FullName : "Student",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        })
        .ToList();

    public ServiceResult<EventReviewResponse> Create(int eventId, int userId, string userRole, EventReviewRequest request)
    {
        if (!string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return ServiceResult<EventReviewResponse>.Forbidden("Sadece öğrenciler etkinlik değerlendirmesi yapabilir.");
        }

        var user = _dbContext.Users.FirstOrDefault(item => item.Id == userId);
        if (user is null)
        {
            return ServiceResult<EventReviewResponse>.Unauthorized("Kullanıcı doğrulanamadı.");
        }

        var @event = _dbContext.Events.FirstOrDefault(item => item.Id == eventId);
        if (@event is null)
        {
            return ServiceResult<EventReviewResponse>.NotFound("Etkinlik bulunamadı.");
        }

        if (@event.EndDate > DateTime.UtcNow)
        {
            return ServiceResult<EventReviewResponse>.BadRequest("Etkinlik tamamlanmadan değerlendirme yapılamaz.");
        }

        var attended = _dbContext.Registrations.Any(registration =>
            registration.EventId == eventId &&
            registration.UserId == userId &&
            registration.Attended);

        if (!attended)
        {
            return ServiceResult<EventReviewResponse>.Forbidden("Yalnızca katıldığınız etkinlikleri değerlendirebilirsiniz.");
        }

        var existing = _dbContext.EventReviews
            .AsNoTracking()
            .FirstOrDefault(review => review.EventId == eventId && review.UserId == userId);

        if (existing is not null)
        {
            return ServiceResult<EventReviewResponse>.Conflict("Bu etkinlik için zaten değerlendirme yaptınız.");
        }

        var created = new EventReview
        {
            EventId = eventId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            User = user
        };

        _dbContext.EventReviews.Add(created);
        _dbContext.SaveChanges();

        return ServiceResult<EventReviewResponse>.Created(new EventReviewResponse
        {
            Id = created.Id,
            EventId = created.EventId,
            UserId = created.UserId,
            UserFullName = user.FullName,
            Rating = created.Rating,
            Comment = created.Comment,
            CreatedAt = created.CreatedAt
        });
    }
}
