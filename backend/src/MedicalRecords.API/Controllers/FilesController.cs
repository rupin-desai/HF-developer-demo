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

        // Set headers for inline viewing instead of download
        Response.Headers.Add("Content-Disposition", $"inline; filename=\"{result.Value.fileName}\"");

        return File(result.Value.fileStream, result.Value.contentType);
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

        return File(result.Value.fileStream, result.Value.contentType, result.Value.fileName);
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