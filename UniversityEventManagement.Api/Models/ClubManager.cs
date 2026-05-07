namespace UniversityEventManagement.Api.Models;

public class ClubManager
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = "Manager";

    public Club? Club { get; set; }
    public User? User { get; set; }
}
