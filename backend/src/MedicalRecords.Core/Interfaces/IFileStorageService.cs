namespace MedicalRecords.Core.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, string? subfolder = null);
    Task<Stream> GetFileAsync(string filePath);
    Task<bool> DeleteFileAsync(string filePath);
    Task<bool> FileExistsAsync(string filePath);
    string GetFileUrl(string filePath);

    // 🔧 ADDED: Missing methods that FileService expects
    long GetMaxFileSize();
    bool IsAllowedFileType(string contentType);
    string[] GetAllowedExtensions();
}