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

// Configure database
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Production: Use PostgreSQL from Render
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseNpgsql(databaseUrl));
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

// Add your services
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IMedicalFileRepository, MedicalFileRepository>();
builder.Services.AddScoped<FileService>();

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
    database = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")) ? "PostgreSQL" : "SQLite"
}));

// Configure for production
app.UseCors("AllowFrontend");

// Add session authentication middleware
app.UseMiddleware<SessionAuthenticationMiddleware>();

app.MapControllers();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<MedicalRecordsDbContext>();
        await context.Database.MigrateAsync();

        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Database migration completed successfully");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
        throw; // Re-throw to prevent startup with broken database
    }
}

app.Run();
