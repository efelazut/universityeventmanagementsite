using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class RegisterRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Department { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Faculty { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string StudentNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string YearClass { get; set; } = string.Empty;

    public bool IsActiveMember { get; set; } = true;

    public int? ClubId { get; set; }
}
