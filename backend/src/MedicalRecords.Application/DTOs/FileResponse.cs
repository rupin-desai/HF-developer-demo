namespace MedicalRecords.Application.DTOs;

public class FileResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public MedicalFileDto? File { get; set; }
}

public class FileListResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public IEnumerable<MedicalFileDto> Files { get; set; } = new List<MedicalFileDto>();
}

public class MedicalFileDto
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadDate { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
}