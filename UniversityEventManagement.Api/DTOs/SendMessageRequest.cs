using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class SendMessageRequest
{
    [Required]
    [MaxLength(4000)]
    public string Body { get; set; } = string.Empty;
}
