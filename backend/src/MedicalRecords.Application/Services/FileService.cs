using MedicalRecords.Application.DTOs;
using MedicalRecords.Core.Entities;
using MedicalRecords.Core.Interfaces;

namespace MedicalRecords.Application.Services;

public class FileService
{
    private readonly IMedicalFileRepository _fileRepository;
    private readonly IFileStorageService _fileStorageService;

    public FileService(
        IMedicalFileRepository fileRepository,
        IFileStorageService fileStorageService)
    {
        _fileRepository = fileRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<FileResponse> UploadFileAsync(FileUploadRequest request, string userId)
    {
        try
        {
            // Validate file
            if (request.File == null || request.File.Length == 0)
            {
                return new FileResponse
                {
                    Success = false,
                    Message = "No file provided"
                };
            }

            // Check file size
            if (request.File.Length > _fileStorageService.GetMaxFileSize())
            {
                return new FileResponse
                {
                    Success = false,
                    Message = $"File size exceeds maximum allowed size of {_fileStorageService.GetMaxFileSize() / 1024 / 1024} MB"
                };
            }

            // 🔧 CRITICAL FIX: Check both content type AND file extension
            var fileName = request.File.FileName;
            var contentType = request.File.ContentType;

            // Validate content type
            if (!_fileStorageService.IsAllowedFileType(contentType))
            {
                return new FileResponse
                {
                    Success = false,
                    Message = "File type not allowed. Allowed types: " + string.Join(", ", _fileStorageService.GetAllowedExtensions())
                };
            }

            // 🔧 NEW: Also validate file extension for extra security
            var fileExtension = Path.GetExtension(fileName).ToLower();
            var allowedExtensions = _fileStorageService.GetAllowedExtensions();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return new FileResponse
                {
                    Success = false,
                    Message = "File extension not allowed. Allowed extensions: " + string.Join(", ", allowedExtensions)
                };
            }

            // Parse file type enum
            if (!Enum.TryParse<FileType>(request.FileType, true, out var fileType))
            {
                return new FileResponse
                {
                    Success = false,
                    Message = "Invalid file type"
                };
            }

            // Save file to storage
            using var stream = request.File.OpenReadStream();
            var filePath = await _fileStorageService.SaveFileAsync(stream, fileName, contentType);

            // Create database record
            var medicalFile = new MedicalFile
            {
                FileName = request.FileName,
                FileType = fileType,
                FilePath = filePath,
                FileSize = request.File.Length,
                ContentType = contentType,
                UserId = userId
            };

            var savedFile = await _fileRepository.CreateAsync(medicalFile);

            return new FileResponse
            {
                Success = true,
                Message = "File uploaded successfully",
                File = new MedicalFileDto
                {
                    Id = savedFile.Id,
                    FileName = savedFile.FileName,
                    FileType = savedFile.FileType.ToString(),
                    FileSize = savedFile.FileSize,
                    UploadDate = savedFile.UploadDate,
                    ContentType = savedFile.ContentType,
                    FileUrl = _fileStorageService.GetFileUrl(savedFile.FilePath)
                }
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"File upload error: {ex.Message}");
            return new FileResponse
            {
                Success = false,
                Message = "An error occurred while uploading the file"
            };
        }
    }

    public async Task<FileListResponse> GetUserFilesAsync(string userId)
    {
        try
        {
            var files = await _fileRepository.GetByUserIdAsync(userId);

            var fileDtos = files.Select(f => new MedicalFileDto
            {
                Id = f.Id,
                FileName = f.FileName,
                FileType = f.FileType.ToString(),
                FileSize = f.FileSize,
                UploadDate = f.UploadDate,
                ContentType = f.ContentType,
                FileUrl = _fileStorageService.GetFileUrl(f.FilePath)
            });

            return new FileListResponse
            {
                Success = true,
                Message = "Files retrieved successfully",
                Files = fileDtos
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"File service error: {ex.Message}");
            return new FileListResponse
            {
                Success = false,
                Message = "An error occurred while retrieving files"
            };
        }
    }

    public async Task<(Stream? fileStream, string fileName, string contentType)?> DownloadFileAsync(string fileId, string userId)
    {
        try
        {
            var file = await _fileRepository.GetByIdAsync(fileId);

            if (file == null || file.UserId != userId)
            {
                return null;
            }

            var fileStream = await _fileStorageService.GetFileAsync(file.FilePath);
            return (fileStream, file.FileName, file.ContentType);
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> DeleteFileAsync(string fileId, string userId)
    {
        try
        {
            var file = await _fileRepository.GetByIdAsync(fileId);

            if (file == null || file.UserId != userId)
            {
                return false;
            }

            // Delete from storage
            await _fileStorageService.DeleteFileAsync(file.FilePath);

            // Delete from database
            await _fileRepository.DeleteAsync(fileId);

            return true;
        }
        catch
        {
            return false;
        }
    }
}