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

    // IMPROVED: Better PostgreSQL connection string parsing
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

Console.WriteLine($"DATABASE_URL exists: {!string.IsNullOrEmpty(databaseUrl)}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Better handling of PostgreSQL URL parsing
        var uri = new Uri(databaseUrl);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432; // Default PostgreSQL port
        var database = uri.LocalPath.TrimStart('/');
        
        string username = "";
        string password = "";
        
        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var userInfo = uri.UserInfo.Split(':');
            username = userInfo[0];
            password = userInfo.Length > 1 ? userInfo[1] : "";
        }
        
        var npgsqlConnectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        
        Console.WriteLine($"Parsed PostgreSQL connection - Host: {host}, Port: {port}, Database: {database}, Username: {username}");
        
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseNpgsql(npgsqlConnectionString));
            
        Console.WriteLine("Successfully configured PostgreSQL database");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error parsing DATABASE_URL: {ex.Message}");
        Console.WriteLine($"DATABASE_URL value: {databaseUrl?.Substring(0, Math.Min(50, databaseUrl.Length ?? 0))}...");
        
        // Fallback to SQLite if DATABASE_URL parsing fails
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseSqlite("Data Source=medical_records.db"));
            
        Console.WriteLine("Fallback to SQLite database");
    }
}
else if (!string.IsNullOrEmpty(connectionString))
{
    // Development: Use SQLite
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseSqlite(connectionString));
        
    Console.WriteLine("Using SQLite database from connection string");
}
else
{
    // Fallback
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseSqlite("Data Source=medical_records.db"));
        
    Console.WriteLine("Using fallback SQLite database");
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
    hasDbUrl = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")),
    port = Environment.GetEnvironmentVariable("PORT")
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
        Console.WriteLine("Testing database connection...");
        await context.Database.CanConnectAsync();
        Console.WriteLine("Database connection successful");
        
        // Apply migrations
        Console.WriteLine("Applying database migrations...");
        await context.Database.MigrateAsync();
        Console.WriteLine("Database migrations completed successfully");
        
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
        Console.WriteLine($"Database migration error: {ex.Message}");
        
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
