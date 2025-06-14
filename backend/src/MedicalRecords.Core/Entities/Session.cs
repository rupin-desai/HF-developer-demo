using System.ComponentModel.DataAnnotations;

namespace MedicalRecords.Core.Entities;

public class Session
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string SessionToken { get; set; } = string.Empty;

    [Required]
    public string UserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public string IpAddress { get; set; } = string.Empty;

    public string UserAgent { get; set; } = string.Empty;

    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation property
    public virtual User User { get; set; } = null!;
}