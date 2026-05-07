using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class LoginRequest
{
    public string EmailOrStudentNumber { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
