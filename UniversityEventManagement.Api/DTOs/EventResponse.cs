namespace UniversityEventManagement.Api.DTOs;

public class EventResponse : IEntityResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Campus { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string LocationDetails { get; set; } = string.Empty;
    public string OrganizerText { get; set; } = string.Empty;
    public string LocationText { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Capacity { get; set; }
    public bool RequiresApproval { get; set; }
    public bool IsFree { get; set; }
    public decimal Price { get; set; }
    public int? ClubId { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public string ClubEmail { get; set; } = string.Empty;
    public string ClubAvatarUrl { get; set; } = string.Empty;
    public int? RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public decimal PosterCost { get; set; }
    public decimal CateringCost { get; set; }
    public decimal SpeakerFee { get; set; }
    public decimal TotalCost { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ComputedStatus { get; set; } = string.Empty;
    public int ActualAttendanceCount { get; set; }
    public int? ParticipantCount { get; set; }
    public int? SourceYear { get; set; }
    public bool IsPastEvent { get; set; }
    public int RegistrationCount { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int ApprovedRegistrationCount { get; set; }
    public int PendingRegistrationCount { get; set; }
}
