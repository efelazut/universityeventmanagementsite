namespace UniversityEventManagement.Api.DTOs;

public class ClubManagerRequest
{
    public int UserId { get; set; }
    public string Role { get; set; } = "Manager";
}
