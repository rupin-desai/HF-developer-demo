using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Services;
using MedicalRecords.Core.Interfaces;
using MedicalRecords.Infrastructure.Data;
using MedicalRecords.Infrastructure.Repositories;
using MedicalRecords.Infrastructure.Services;
using MedicalRecords.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000") // Your frontend URL
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
}

builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
{
    options.UseSqlite(connectionString);
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<IMedicalFileRepository, MedicalFileRepository>();

// Add services
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<FileService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<MedicalRecordsDbContext>();

        // This will create the database if it doesn't exist
        var created = context.Database.EnsureCreated();

        if (created)
        {
            Console.WriteLine("Database created successfully!");
        }
        else
        {
            Console.WriteLine("Database already exists.");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while creating the database.");
        throw;
    }
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// Add static file serving for uploads
app.UseStaticFiles();

// Add session authentication middleware
app.UseMiddleware<SessionAuthenticationMiddleware>();

app.MapControllers();

app.Run();
