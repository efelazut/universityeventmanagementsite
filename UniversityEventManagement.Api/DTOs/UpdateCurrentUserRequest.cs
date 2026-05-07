using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class UpdateCurrentUserRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
}
