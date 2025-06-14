using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Services;
using MedicalRecords.Core.Interfaces;
using MedicalRecords.Infrastructure.Data;
using MedicalRecords.Infrastructure.Repositories;
using MedicalRecords.Infrastructure.Services;
using MedicalRecords.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for Docker/Render
builder.WebHost.ConfigureKestrel(options =>
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    options.ListenAnyIP(int.Parse(port));
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure database with proper connection string handling
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Parse Render's PostgreSQL URL format
    try
    {
        var uri = new Uri(databaseUrl);
        var npgsqlConnectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.LocalPath.TrimStart('/')};Username={uri.UserInfo.Split(':')[0]};Password={uri.UserInfo.Split(':')[1]};SSL Mode=Require;Trust Server Certificate=true";
        
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseNpgsql(npgsqlConnectionString));
            
        Console.WriteLine($"Using PostgreSQL database: {uri.Host}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing DATABASE_URL: {ex.Message}");
        Console.WriteLine($"DATABASE_URL format: {databaseUrl}");
        
        // Fallback to SQLite if DATABASE_URL parsing fails
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseSqlite("Data Source=medical_records.db"));
    }
}
else if (!string.IsNullOrEmpty(connectionString))
{
    // Development: Use SQLite
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseSqlite(connectionString));
}
else
{
    // Fallback
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseSqlite("Data Source=medical_records.db"));
}

// Add CORS for your Vercel frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://hf-developer-demo.vercel.app", // Your Vercel URL
            "https://*.vercel.app",
            "http://localhost:3000" // For local development
        )
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Register Infrastructure Services
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();

// Register Repositories
builder.Services.AddScoped<IMedicalFileRepository, MedicalFileRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Application Services
builder.Services.AddScoped<FileService>();
builder.Services.AddScoped<AuthService>();

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health check endpoint for Render
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
    version = "1.0.0",
    database = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")) ? "PostgreSQL" : "SQLite",
    hasDbUrl = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"))
}));

// Configure for production
app.UseCors("AllowFrontend");

// Add session authentication middleware
app.UseMiddleware<SessionAuthenticationMiddleware>();

app.MapControllers();

// Auto-migrate database on startup with better error handling
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<MedicalRecordsDbContext>();
        
        // Test database connection first
        await context.Database.CanConnectAsync();
        
        // Apply migrations
        await context.Database.MigrateAsync();
        
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
        
        // Don't throw in production - let the app start and handle gracefully
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
        else
        {
            logger.LogWarning("Continuing startup without database migration in production");
        }
    }
}

app.Run();
