namespace UniversityEventManagement.Api.DTOs;

public class ClubManagerResponse : IEntityResponse
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
