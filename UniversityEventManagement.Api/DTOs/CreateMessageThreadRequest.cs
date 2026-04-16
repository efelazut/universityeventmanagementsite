using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class CreateMessageThreadRequest
{
    [Range(1, int.MaxValue)]
    public int ClubId { get; set; }

    [Required]
    [MaxLength(180)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string InitialMessage { get; set; } = string.Empty;
}
