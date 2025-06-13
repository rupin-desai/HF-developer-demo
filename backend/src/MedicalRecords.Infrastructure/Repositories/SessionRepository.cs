using Microsoft.EntityFrameworkCore;
using MedicalRecords.Core.Entities;
using MedicalRecords.Core.Interfaces;
using MedicalRecords.Infrastructure.Data;

namespace MedicalRecords.Infrastructure.Repositories;

public class SessionRepository : ISessionRepository
{
    private readonly MedicalRecordsDbContext _context;

    public SessionRepository(MedicalRecordsDbContext context)
    {
        _context = context;
    }

    public async Task<UserSession?> GetByTokenAsync(string token)
    {
        return await _context.UserSessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.SessionToken == token && s.IsActive);
    }

    public async Task<UserSession> CreateAsync(UserSession session)
    {
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task UpdateAsync(UserSession session)
    {
        _context.UserSessions.Update(session);
        await _context.SaveChangesAsync();
    }

    public async Task DeactivateAsync(string token)
    {
        var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.SessionToken == token);
        if (session != null)
        {
            session.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeactivateAllUserSessionsAsync(string userId)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.IsActive = false;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CleanupExpiredSessionsAsync()
    {
        var expiredSessions = await _context.UserSessions
            .Where(s => s.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        foreach (var session in expiredSessions)
        {
            session.IsActive = false;
        }

        await _context.SaveChangesAsync();
    }
}