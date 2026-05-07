namespace UniversityEventManagement.Api.DTOs;

public class ClubFollowStatusResponse
{
    public int ClubId { get; set; }
    public bool IsFollowing { get; set; }
    public int FollowerCount { get; set; }
}
