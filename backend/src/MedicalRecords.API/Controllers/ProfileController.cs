using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Application.DTOs;
using MedicalRecords.Application.Services;

namespace MedicalRecords.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AuthService _authService;

    public ProfileController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPut("update")]
    public async Task<ActionResult<ProfileUpdateResponse>> UpdateProfile([FromForm] ProfileUpdateRequest request)
    {
        var userId = HttpContext.Items["UserId"] as string;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new ProfileUpdateResponse
            {
                Success = false,
                Message = "User not authenticated"
            });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new ProfileUpdateResponse
            {
                Success = false,
                Message = "Invalid data provided"
            });
        }

        var result = await _authService.UpdateProfileAsync(request, userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("picture/{userId}")]
    public IActionResult GetProfilePicture(string userId)
    {
        try
        {
            // This endpoint can be used to serve profile pictures
            // Implementation depends on how you want to handle profile picture access
            return NotFound("Profile picture not found");
        }
        catch (Exception)
        {
            return NotFound();
        }
    }
}