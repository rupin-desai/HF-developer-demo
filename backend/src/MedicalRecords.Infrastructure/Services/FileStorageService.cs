using MedicalRecords.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MedicalRecords.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly long _maxFileSize;
    private readonly string[] _allowedExtensions;

    public FileStorageService(IConfiguration configuration)
    {
        _basePath = configuration["FileStorage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _maxFileSize = long.Parse(configuration["FileStorage:MaxFileSize"] ?? "10485760"); // 10MB default
        _allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx" };

        // Ensure base directory exists
        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
        }
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, string? subfolder = null)
    {
        try
        {
            // Sanitize filename
            var sanitizedFileName = SanitizeFileName(fileName);

            // Determine storage path
            var storageFolder = string.IsNullOrEmpty(subfolder) ? "medical-files" : subfolder;
            var directoryPath = Path.Combine(_basePath, storageFolder);
            EnsureDirectoryExists(directoryPath);

            var filePath = Path.Combine(directoryPath, sanitizedFileName);

            // Ensure unique filename
            var counter = 1;
            var originalFilePath = filePath;
            while (File.Exists(filePath))
            {
                var nameWithoutExt = Path.GetFileNameWithoutExtension(originalFilePath);
                var extension = Path.GetExtension(originalFilePath);
                var newFileName = $"{nameWithoutExt}_{counter}{extension}";
                filePath = Path.Combine(directoryPath, newFileName);
                counter++;
            }

            // Save file
            using var fileStreamWriter = new FileStream(filePath, FileMode.Create);
            await fileStream.CopyToAsync(fileStreamWriter);

            // Return relative path for database storage
            var relativePath = Path.GetRelativePath(_basePath, filePath);
            return relativePath.Replace('\\', '/');
        }
        catch (Exception ex)
        {
            Console.WriteLine($"File save error: {ex.Message}");
            throw;
        }
    }

    public Task<Stream> GetFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        return Task.FromResult<Stream>(new FileStream(fullPath, FileMode.Open, FileAccess.Read));
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            var fullPath = Path.Combine(_basePath, filePath.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    public Task<bool> FileExistsAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath.Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult(File.Exists(fullPath));
    }

    public string GetFileUrl(string filePath)
    {
        // Return URL path for accessing files through StaticFilesController
        return $"/staticfiles/{filePath.Replace('\\', '/')}";
    }

    public long GetMaxFileSize()
    {
        return _maxFileSize;
    }

    // 🔧 ENHANCED: Complete MIME type validation
    public bool IsAllowedFileType(string contentType)
    {
        if (string.IsNullOrEmpty(contentType))
            return false;

        // Normalize content type (remove charset, etc.)
        var normalizedContentType = contentType.Split(';')[0].Trim().ToLower();

        var allowedTypes = new[]
        {
            // PDF files
            "application/pdf",
            
            // Image files
            "image/jpeg",
            "image/jpg",     // Some browsers might send this
            "image/pjpeg",   // Progressive JPEG
            "image/png",
            "image/x-png",   // Alternative PNG MIME type
            "image/gif",
            "image/webp",    // WebP support
            
            // Microsoft Word files
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            
            // Additional document types
            "text/plain",
            "application/rtf",
            "text/rtf",
            
            // 🔧 BROWSER SPECIFIC: Some browsers send different MIME types
            "application/octet-stream" // Fallback for some file uploads
        };

        return allowedTypes.Contains(normalizedContentType);
    }

    public string[] GetAllowedExtensions()
    {
        return _allowedExtensions;
    }

    private void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }

    private string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());

        // Replace spaces with underscores
        sanitized = sanitized.Replace(' ', '_');

        // Ensure we don't have an empty filename
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            sanitized = "file";
        }

        return sanitized;
    }
}