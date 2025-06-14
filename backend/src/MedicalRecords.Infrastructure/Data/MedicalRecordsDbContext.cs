using Microsoft.EntityFrameworkCore;
using MedicalRecords.Core.Entities;

namespace MedicalRecords.Infrastructure.Data;

public class MedicalRecordsDbContext : DbContext
{
    public MedicalRecordsDbContext(DbContextOptions<MedicalRecordsDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<MedicalFile> MedicalFiles { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Suppress pending model changes warning for production
        optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            // Explicitly configure boolean for PostgreSQL
            entity.Property(e => e.IsActive)
                  .HasColumnType("boolean")
                  .HasDefaultValue(true);
        });

        // Configure MedicalFile entity
        modelBuilder.Entity<MedicalFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.FilePath).HasMaxLength(500);
            entity.Property(e => e.ContentType).HasMaxLength(100);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.MedicalFiles)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure UserSession entity
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SessionToken).IsUnique();
            entity.Property(e => e.SessionToken).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            // Explicitly configure boolean for PostgreSQL
            entity.Property(e => e.IsActive)
                  .HasColumnType("boolean")
                  .HasDefaultValue(true);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Sessions)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        base.OnModelCreating(modelBuilder);
    }
}