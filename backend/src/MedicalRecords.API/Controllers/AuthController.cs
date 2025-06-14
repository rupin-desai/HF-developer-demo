using Microsoft.AspNetCore.Mvc;
using MedicalRecords.Application.DTOs;
using MedicalRecords.Application.Services;

namespace MedicalRecords.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var result = await _authService.LoginAsync(request, ipAddress, userAgent);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        // 🔧 UPDATED: Set session cookie with production-ready settings
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Always use HTTPS in production
            SameSite = SameSiteMode.None, // Required for cross-domain
            Expires = DateTimeOffset.UtcNow.AddDays(1), // 1 day expiration
            Path = "/",
            Domain = null // Let browser handle domain
        };

        // Set for development vs production
        if (HttpContext.Request.Host.Host == "localhost")
        {
            cookieOptions.Secure = false; // Allow HTTP for localhost
            cookieOptions.SameSite = SameSiteMode.Lax;
        }

        Response.Cookies.Append("session_token", result.SessionToken!, cookieOptions);

        return Ok(result);
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignupRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.SignupAsync(request);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var sessionToken = Request.Cookies["session_token"];

        if (!string.IsNullOrEmpty(sessionToken))
        {
            await _authService.LogoutAsync(sessionToken);
        }

        Response.Cookies.Delete("session_token");

        return Ok(new { Success = true, Message = "Logged out successfully" });
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var sessionToken = Request.Cookies["session_token"];

        if (string.IsNullOrEmpty(sessionToken))
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(sessionToken);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(user);
    }
}