using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Application.DTOs;
using MedicalRecords.Application.Services;

namespace MedicalRecords.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly FileService _fileService;

    public FilesController(FileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<FileResponse>> UploadFile([FromForm] FileUploadRequest request)
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { Success = false, Message = "User not authenticated" });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _fileService.UploadFileAsync(request, userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<FileListResponse>> GetFiles()
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { Success = false, Message = "User not authenticated" });
        }

        var result = await _fileService.GetUserFilesAsync(userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("{id}/view")]
    public async Task<IActionResult> ViewFile(string id)
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _fileService.DownloadFileAsync(id, userId);

        if (result == null)
        {
            return NotFound();
        }

        // Extract the values and add null checks
        var (fileStream, fileName, contentType) = result.Value;

        if (fileStream == null)
        {
            return NotFound("File content not available");
        }

        if (string.IsNullOrEmpty(contentType))
        {
            contentType = "application/octet-stream";
        }

        if (string.IsNullOrEmpty(fileName))
        {
            fileName = "unknown";
        }

        // Use indexer to set headers instead of Add() - this prevents duplicate key exceptions
        Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"";

        // Also set cache control headers for better browser viewing
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        return File(fileStream, contentType);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadFile(string id)
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _fileService.DownloadFileAsync(id, userId);

        if (result == null)
        {
            return NotFound();
        }

        // Extract the values and add null checks
        var (fileStream, fileName, contentType) = result.Value;

        if (fileStream == null)
        {
            return NotFound("File content not available");
        }

        if (string.IsNullOrEmpty(contentType))
        {
            contentType = "application/octet-stream";
        }

        if (string.IsNullOrEmpty(fileName))
        {
            fileName = "download";
        }

        // Set additional headers for download
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        return File(fileStream, contentType, fileName);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteFile(string id)
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { Success = false, Message = "User not authenticated" });
        }

        var result = await _fileService.DeleteFileAsync(id, userId);

        if (!result)
        {
            return NotFound(new { Success = false, Message = "File not found or access denied" });
        }

        return Ok(new { Success = true, Message = "File deleted successfully" });
    }
}