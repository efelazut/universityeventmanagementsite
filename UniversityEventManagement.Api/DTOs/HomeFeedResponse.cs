namespace UniversityEventManagement.Api.DTOs;

public class HomeFeedResponse
{
    public IReadOnlyList<EventResponse> PopularEvents { get; set; } = [];
    public IReadOnlyList<EventResponse> UpcomingEvents { get; set; } = [];
    public IReadOnlyList<EventResponse> OngoingEvents { get; set; } = [];
    public IReadOnlyList<ClubResponse> FeaturedClubs { get; set; } = [];
    public int ActiveClubCount { get; set; }
    public int UpcomingEventCount { get; set; }
    public int TotalParticipationCount { get; set; }
    public int ActiveStudentCount { get; set; }
}
