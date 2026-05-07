namespace UniversityEventManagement.Api.Models;

public class ClubFollower
{
    public int Id { get; set; }
    public int ClubId { get; set; }
    public int UserId { get; set; }
    public DateTime FollowedAt { get; set; }

    public Club? Club { get; set; }
    public User? User { get; set; }
}
