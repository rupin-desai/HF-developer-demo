using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace MedicalRecords.Application.DTOs;

public class ProfileUpdateRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Gender { get; set; } = string.Empty;

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    // Optional profile picture upload
    public IFormFile? ProfilePicture { get; set; }

    // Existing profile image path (if not updating picture)
    public string? ExistingProfileImage { get; set; }
}

public class ProfileUpdateResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserDto? User { get; set; }
}