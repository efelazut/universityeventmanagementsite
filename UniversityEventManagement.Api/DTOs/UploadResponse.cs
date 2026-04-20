namespace UniversityEventManagement.Api.DTOs;

public class UploadResponse
{
    public string FileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public long Size { get; set; }
}
