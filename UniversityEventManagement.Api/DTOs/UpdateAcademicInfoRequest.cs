using System.ComponentModel.DataAnnotations;

namespace UniversityEventManagement.Api.DTOs;

public class UpdateAcademicInfoRequest
{
    [MaxLength(150)]
    public string Faculty { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(50)]
    public string YearClass { get; set; } = string.Empty;
}
