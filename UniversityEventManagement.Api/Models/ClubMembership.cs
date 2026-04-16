namespace UniversityEventManagement.Api.Models;

public class ClubMembership
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }

    public Club? Club { get; set; }
    public User? User { get; set; }
}
