namespace UniversityEventManagement.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Campus { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string LocationDetails { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Capacity { get; set; }
    public bool RequiresApproval { get; set; }
    public bool IsFree { get; set; }
    public decimal Price { get; set; }
    public int ClubId { get; set; }
    public int RoomId { get; set; }
    public decimal PosterCost { get; set; }
    public decimal CateringCost { get; set; }
    public decimal SpeakerFee { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ActualAttendanceCount { get; set; }

    public Club? Club { get; set; }
    public Room? Room { get; set; }
    public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
    public ICollection<EventReview> Reviews { get; set; } = new List<EventReview>();
}
