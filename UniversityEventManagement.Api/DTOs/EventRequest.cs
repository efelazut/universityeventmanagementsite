using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class EventRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Campus { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Format { get; set; } = string.Empty;

    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(300)]
    public string LocationDetails { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }

    public bool RequiresApproval { get; set; }

    public bool IsFree { get; set; } = true;

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(1, int.MaxValue)]
    public int? ClubId { get; set; }

    [Range(1, int.MaxValue)]
    public int RoomId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PosterCost { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CateringCost { get; set; }

    [Range(0, double.MaxValue)]
    public decimal SpeakerFee { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int ActualAttendanceCount { get; set; }
}
