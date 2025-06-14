using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Core.Interfaces;

namespace MedicalRecords.API.Controllers;

[ApiController]
[Route("[controller]")]
public class StaticFilesController : ControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public StaticFilesController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpGet("{*filePath}")]
    public async Task<IActionResult> GetFile(string filePath)
    {
        try
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return NotFound();
            }

            // Decode the file path
            filePath = Uri.UnescapeDataString(filePath);

            // Check if file exists
            if (!await _fileStorageService.FileExistsAsync(filePath))
            {
                return NotFound();
            }

            // Get file stream
            var fileStream = await _fileStorageService.GetFileAsync(filePath);

            // Determine content type based on file extension
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };

            // Set cache headers for images (especially profile pictures)
            if (contentType.StartsWith("image/"))
            {
                Response.Headers["Cache-Control"] = "public, max-age=3600"; // 1 hour cache
            }

            return File(fileStream, contentType);
        }
        catch (Exception)
        {
            return NotFound();
        }
    }
}