using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class EventReviewRequest
{
    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string Comment { get; set; } = string.Empty;
}
