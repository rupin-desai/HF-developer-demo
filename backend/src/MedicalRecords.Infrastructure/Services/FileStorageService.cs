using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MedicalRecords.Core.Interfaces;

namespace MedicalRecords.Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
        {
            _logger = logger;

            // 🔧 FIX: Read from environment variables first (set in render.yaml)
            _basePath = Environment.GetEnvironmentVariable("FileStorage__BasePath")
                       ?? configuration["FileStorage:BasePath"]
                       ?? GetDefaultBasePath();

            _maxFileSize = long.Parse(Environment.GetEnvironmentVariable("FileStorage__MaxFileSize")
                                    ?? configuration["FileStorage:MaxFileSize"]
                                    ?? "10485760");

            _allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx" };

            InitializeStorage();
        }

        private string GetDefaultBasePath()
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

            if (environment == "Production")
            {
                // Use persistent disk path in production
                return "/app/uploads";
            }
            else
            {
                // Development
                return Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            }
        }

        private void InitializeStorage()
        {
            try
            {
                _logger.LogInformation("Initializing file storage at: {BasePath}", _basePath);

                if (!Directory.Exists(_basePath))
                {
                    Directory.CreateDirectory(_basePath);
                    _logger.LogInformation("Created storage directory: {BasePath}", _basePath);
                }

                // Test write permissions
                var testFile = Path.Combine(_basePath, $"test_write_{DateTime.UtcNow.Ticks}.tmp");
                File.WriteAllText(testFile, "test");
                File.Delete(testFile);

                _logger.LogInformation("Storage directory is ready and writable: {BasePath}", _basePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize storage directory: {BasePath}", _basePath);
                throw new InvalidOperationException($"Cannot initialize file storage at {_basePath}: {ex.Message}");
            }
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, string? subfolder = null)
        {
            try
            {
                var extension = Path.GetExtension(fileName).ToLowerInvariant();
                if (!_allowedExtensions.Contains(extension))
                {
                    throw new ArgumentException($"File type {extension} is not allowed");
                }

                if (fileStream.Length > _maxFileSize)
                {
                    throw new ArgumentException($"File size exceeds maximum allowed size");
                }

                var sanitizedFileName = SanitizeFileName(Path.GetFileNameWithoutExtension(fileName));
                var uniqueFileName = $"{sanitizedFileName}_{Guid.NewGuid()}{extension}";

                var targetDirectory = string.IsNullOrEmpty(subfolder)
                    ? _basePath
                    : Path.Combine(_basePath, subfolder);

                EnsureDirectoryExists(targetDirectory);

                var filePath = Path.Combine(targetDirectory, uniqueFileName);
                var relativePath = string.IsNullOrEmpty(subfolder)
                    ? uniqueFileName
                    : $"{subfolder}/{uniqueFileName}";

                using var fileStreamOut = new FileStream(filePath, FileMode.Create);
                await fileStream.CopyToAsync(fileStreamOut);

                _logger.LogInformation("File saved: {FileName} -> {RelativePath}", fileName, relativePath);
                return relativePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file: {FileName}", fileName);
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
}