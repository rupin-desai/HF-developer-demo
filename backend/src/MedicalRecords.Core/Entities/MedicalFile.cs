using System.ComponentModel.DataAnnotations;

namespace MedicalRecords.Core.Entities;

public class MedicalFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string FileName { get; set; } = string.Empty;

    public FileType FileType { get; set; }

    [Required]
    public string FilePath { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    [Required]
    public string UserId { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    // Navigation property
    public virtual User User { get; set; } = null!;
}

public enum FileType
{
    LabReport,
    Prescription,
    XRay,
    BloodReport,
    MRIScan,
    CTScan
}