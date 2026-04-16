using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class ClubRequest
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(500)]
    public string AvatarUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string BannerUrl { get; set; } = string.Empty;

    [MaxLength(1200)]
    public string ShowcaseSummary { get; set; } = string.Empty;

    [MaxLength(200)]
    public string HighlightTitle { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string PresidentName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string PresidentEmail { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
