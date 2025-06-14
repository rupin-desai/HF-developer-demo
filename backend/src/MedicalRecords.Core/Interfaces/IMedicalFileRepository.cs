using MedicalRecords.Core.Entities;

namespace MedicalRecords.Core.Interfaces;

public interface IMedicalFileRepository
{
    Task<MedicalFile?> GetByIdAsync(string id);
    Task<IEnumerable<MedicalFile>> GetByUserIdAsync(string userId);
    Task<MedicalFile> CreateAsync(MedicalFile medicalFile);
    Task<MedicalFile> UpdateAsync(MedicalFile medicalFile);
    Task DeleteAsync(string id);
    Task<bool> ExistsAsync(string id);
    Task<IEnumerable<MedicalFile>> GetByFileTypeAsync(string userId, FileType fileType);
}