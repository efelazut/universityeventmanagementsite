using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024;
    private readonly IWebHostEnvironment _environment;

    public UploadsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [Authorize(Roles = "Admin,ClubManager")]
    [HttpPost("image")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<UploadResponse>> UploadImage(IFormFile? file, [FromForm] string? category)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails { Title = "Yüklenecek görsel bulunamadı." });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new ProblemDetails { Title = "Görsel boyutu 5 MB sınırını aşamaz." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new ProblemDetails { Title = "Yalnızca JPG, PNG veya WEBP görseller yüklenebilir." });
        }

        var safeCategory = string.IsNullOrWhiteSpace(category) ? "general" : category.Trim().ToLowerInvariant();
        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var targetDirectory = Path.Combine(webRootPath, "uploads", safeCategory);
        Directory.CreateDirectory(targetDirectory);

        var fileName = $"{safeCategory}-{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(targetDirectory, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/{safeCategory}/{fileName}";
        var publicUrl = $"{Request.Scheme}://{Request.Host}{relativePath}";

        return Ok(new UploadResponse
        {
            FileName = fileName,
            RelativePath = relativePath,
            PublicUrl = publicUrl,
            Size = file.Length
        });
    }
}
