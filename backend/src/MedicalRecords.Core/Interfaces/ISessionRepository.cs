using MedicalRecords.Core.Entities;

namespace MedicalRecords.Core.Interfaces;

public interface ISessionRepository
{
    Task<UserSession?> GetByTokenAsync(string token);
    Task<UserSession> CreateAsync(UserSession session);
    Task UpdateAsync(UserSession session);
    Task DeactivateAsync(string token);
    Task DeactivateAllUserSessionsAsync(string userId);
    Task CleanupExpiredSessionsAsync();
}