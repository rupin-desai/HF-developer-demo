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
        // Use proper configuration binding
        _basePath = configuration["FileStorage:BasePath"] ?? "uploads";
        
        // Use TryParse for safe conversion
        var maxFileSizeStr = configuration["FileStorage:MaxFileSize"];
        _maxFileSize = long.TryParse(maxFileSizeStr, out var maxSize) ? maxSize : 10485760; // 10MB default

        // Get allowed extensions array manually
        var allowedExtensionsSection = configuration.GetSection("FileStorage:AllowedExtensions");
        var extensionsList = new List<string>();
        
        foreach (var extension in allowedExtensionsSection.GetChildren())
        {
            if (!string.IsNullOrEmpty(extension.Value))
            {
                extensionsList.Add(extension.Value);
            }
        }
        
        _allowedExtensions = extensionsList.Count > 0 ? extensionsList.ToArray() : 
                           new[] { ".pdf", ".jpg", ".jpeg", ".png" };

        // Ensure base directory exists
        Directory.CreateDirectory(_basePath);
        Directory.CreateDirectory(Path.Combine(_basePath, "medical-files"));
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var fileExtension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var relativePath = Path.Combine("medical-files", uniqueFileName);
        var fullPath = Path.Combine(_basePath, relativePath);

        // Ensure directory exists
        var directory = Path.GetDirectoryName(fullPath);
        if (directory != null)
        {
            Directory.CreateDirectory(directory);
        }

        using var fileStreamOutput = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(fileStreamOutput);

        return relativePath;
    }

    public Task<Stream> GetFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("File not found");
        }

        return Task.FromResult<Stream>(new FileStream(fullPath, FileMode.Open, FileAccess.Read));
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            var fullPath = Path.Combine(_basePath, filePath);

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
        var fullPath = Path.Combine(_basePath, filePath);
        return Task.FromResult(File.Exists(fullPath));
    }

    public string GetFileUrl(string filePath)
    {
        // For development, return a direct file path
        // In production, you might want to return a URL to a CDN or file server
        return $"/files/{filePath.Replace('\\', '/')}";
    }

    public long GetMaxFileSize()
    {
        return _maxFileSize;
    }

    public string[] GetAllowedExtensions()
    {
        return _allowedExtensions;
    }

    public bool IsAllowedFileType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return _allowedExtensions.Contains(extension);
    }
}