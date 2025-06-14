using Microsoft.EntityFrameworkCore;
using MedicalRecords.Core.Entities;
using MedicalRecords.Core.Interfaces;
using MedicalRecords.Infrastructure.Data;

namespace MedicalRecords.Infrastructure.Repositories;

public class MedicalFileRepository : IMedicalFileRepository
{
    private readonly MedicalRecordsDbContext _context;

    public MedicalFileRepository(MedicalRecordsDbContext context)
    {
        _context = context;
    }

    public async Task<MedicalFile?> GetByIdAsync(string id)
    {
        return await _context.MedicalFiles.FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<IEnumerable<MedicalFile>> GetByUserIdAsync(string userId)
    {
        return await _context.MedicalFiles
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.UploadDate)
            .ToListAsync();
    }

    public async Task<MedicalFile> CreateAsync(MedicalFile medicalFile)
    {
        _context.MedicalFiles.Add(medicalFile);
        await _context.SaveChangesAsync();
        return medicalFile;
    }

    public async Task<MedicalFile> UpdateAsync(MedicalFile medicalFile)
    {
        _context.MedicalFiles.Update(medicalFile);
        await _context.SaveChangesAsync();
        return medicalFile;
    }

    public async Task DeleteAsync(string id)
    {
        var file = await GetByIdAsync(id);
        if (file != null)
        {
            _context.MedicalFiles.Remove(file);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string id)
    {
        return await _context.MedicalFiles.AnyAsync(f => f.Id == id);
    }

    public async Task<IEnumerable<MedicalFile>> GetByFileTypeAsync(string userId, FileType fileType)
    {
        return await _context.MedicalFiles
            .Where(f => f.UserId == userId && f.FileType == fileType)
            .OrderByDescending(f => f.UploadDate)
            .ToListAsync();
    }
}