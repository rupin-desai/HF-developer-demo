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
        _basePath = configuration["FileStorage:BasePath"] ?? "uploads";

        // 🔧 FIXED: Use simple string parsing instead of GetValue<T>
        var maxFileSizeStr = configuration["FileStorage:MaxFileSize"];
        _maxFileSize = long.TryParse(maxFileSizeStr, out var maxSize) ? maxSize : 10485760; // 10MB default

        // 🔧 FIXED: Use simple configuration reading for extensions
        var extensionsSection = configuration.GetSection("FileStorage:AllowedExtensions");
        var extensionsList = new List<string>();

        foreach (var child in extensionsSection.GetChildren())
        {
            if (!string.IsNullOrWhiteSpace(child.Value))
            {
                extensionsList.Add(child.Value);
            }
        }

        _allowedExtensions = extensionsList.Count > 0
            ? extensionsList.ToArray()
            : new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };

        // Ensure directories exist
        EnsureDirectoryExists(Path.Combine(_basePath, "medical-files"));
        EnsureDirectoryExists(Path.Combine(_basePath, "profiles"));
        EnsureDirectoryExists(Path.Combine(_basePath, "temp"));
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

            using var fileStreamOutput = new FileStream(filePath, FileMode.Create);
            await fileStream.CopyToAsync(fileStreamOutput);

            // Return relative path for storage in database
            return Path.Combine(storageFolder, Path.GetFileName(filePath)).Replace('\\', '/');
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to save file: {ex.Message}", ex);
        }
    }

    public Task<Stream> GetFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        Stream fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return Task.FromResult(fileStream);
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
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting file {filePath}: {ex.Message}");
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

    public bool IsAllowedFileType(string contentType)
    {
        if (string.IsNullOrEmpty(contentType))
            return false;

        var allowedTypes = new[]
        {
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        return allowedTypes.Contains(contentType.ToLower());
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