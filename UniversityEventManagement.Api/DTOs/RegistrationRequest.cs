using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class RegistrationRequest
{
    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [Range(1, int.MaxValue)]
    public int EventId { get; set; }

    public DateTime? RegisteredAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public bool Attended { get; set; }
}
