using System.ComponentModel.DataAnnotations;

namespace MedicalRecords.Core.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public Gender Gender { get; set; }

    [Required]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string ProfileImage { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<MedicalFile> MedicalFiles { get; set; } = new List<MedicalFile>();
    public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();
}

public enum Gender
{
    Male,
    Female
}