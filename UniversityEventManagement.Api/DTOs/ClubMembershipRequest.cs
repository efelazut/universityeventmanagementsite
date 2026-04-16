using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class ClubMembershipRequest
{
    [Range(1, int.MaxValue)]
    public int UserId { get; set; }

    [MaxLength(40)]
    public string Role { get; set; } = "Member";
}
