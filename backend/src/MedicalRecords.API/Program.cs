using Microsoft.EntityFrameworkCore;
using MedicalRecords.Application.Services;
using MedicalRecords.Core.Interfaces;
using MedicalRecords.Infrastructure.Data;
using MedicalRecords.Infrastructure.Repositories;
using MedicalRecords.Infrastructure.Services;
using MedicalRecords.API.Middleware;
using Npgsql;

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
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

if (!string.IsNullOrEmpty(databaseUrl))
{
    try
    {
        // Production: Parse DATABASE_URL for PostgreSQL
        var uri = new Uri(databaseUrl);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
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

        // Fallback to SQLite
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseSqlite("Data Source=medical_records.db"));

        Console.WriteLine("Fallback to SQLite database");
    }
}
else if (!string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine($"Connection string from config: {connectionString}");

    // 🔧 ENHANCED: Better connection string detection
    if (connectionString.Contains("Host=") || connectionString.Contains("host=") ||
        connectionString.Contains("Server=") || connectionString.Contains("server="))
    {
        // Clear any existing connection pools
        NpgsqlConnection.ClearAllPools();

        // Test direct Npgsql connection first
        try
        {
            Console.WriteLine("Testing direct Npgsql connection...");
            Console.WriteLine($"Using connection string: {connectionString}");

            using var testConnection = new NpgsqlConnection(connectionString);

            await testConnection.OpenAsync();

            // Test a simple query
            using var command = new NpgsqlCommand("SELECT version()", testConnection);
            var result = await command.ExecuteScalarAsync();
            Console.WriteLine($"✅ Direct Npgsql connection successful! PostgreSQL: {result}");

            await testConnection.CloseAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Direct Npgsql connection failed: {ex.Message}");
            Console.WriteLine($"❌ Inner exception: {ex.InnerException?.Message}");
            Console.WriteLine($"❌ Connection string: {connectionString}");
        }

        // Development: Use PostgreSQL with enhanced configuration
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.CommandTimeout(60);
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
            });

            // Disable connection pooling for testing
            options.EnableServiceProviderCaching(false);
            options.EnableSensitiveDataLogging(builder.Environment.IsDevelopment());

            if (builder.Environment.IsDevelopment())
            {
                options.LogTo(Console.WriteLine, LogLevel.Information);
            }
        });

        Console.WriteLine("Using PostgreSQL database from connection string");
    }
    else
    {
        // Development: Use SQLite
        builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
            options.UseSqlite(connectionString));

        Console.WriteLine("Using SQLite database from connection string");
    }
}
else
{
    // Fallback
    builder.Services.AddDbContext<MedicalRecordsDbContext>(options =>
        options.UseSqlite("Data Source=medical_records.db"));

    Console.WriteLine("Using fallback SQLite database");
}

// 🔧 REPLACE: Update your existing CORS configuration (around line 135-155)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://hf-developer-demo.vercel.app",
            "https://*.vercel.app",
            "http://localhost:3000"
        )
        .AllowCredentials() // Essential for cookies
        .AllowAnyHeader()
        .AllowAnyMethod();

        // Handle wildcard subdomains for Vercel
        policy.SetIsOriginAllowed(origin =>
        {
            return origin.Contains("vercel.app") ||
                   origin == "http://localhost:3000" ||
                   origin == "https://hf-developer-demo.vercel.app";
        });
    });
});

// 🔧 ADD: Configure session cookies for production (NEW - add after CORS)
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => false; // Disable consent check
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.Always;
});

// 🔧 ADD: Configure application cookies for session management (NEW)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "session_token";
    options.Cookie.SameSite = SameSiteMode.None; // Required for cross-domain
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // HTTPS only in production
    options.Cookie.HttpOnly = true; // Security
    options.ExpireTimeSpan = TimeSpan.FromDays(1); // 1 day expiration
    options.SlidingExpiration = true; // Extend on activity
    options.LoginPath = "/api/auth/login";
    options.LogoutPath = "/api/auth/logout";
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
app.MapGet("/health", (ILogger<Program> logger, IServiceProvider services) =>
{
    try
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var storagePath = Environment.GetEnvironmentVariable("FileStorage__BasePath") ?? "/app/uploads";

        // Test storage
        var storageHealthy = true;
        var storageMessage = "OK";

        try
        {
            if (Directory.Exists(storagePath))
            {
                // Test write permissions
                var testFile = Path.Combine(storagePath, $"health_check_{DateTime.UtcNow.Ticks}.tmp");
                File.WriteAllText(testFile, "health check");
                File.Delete(testFile);
                storageMessage = $"Writable at {storagePath}";

                // Check if it's persistent disk
                var diskInfo = new DirectoryInfo(storagePath);
                var freeSpace = diskInfo.Parent?.GetDirectories().Length ?? 0;
                storageMessage += $" (entries: {freeSpace})";
            }
            else
            {
                storageHealthy = false;
                storageMessage = $"Directory not found: {storagePath}";
            }
        }
        catch (Exception ex)
        {
            storageHealthy = false;
            storageMessage = ex.Message;
        }

        return Results.Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            environment = environment,
            version = "1.0.0",
            database = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")) ? "PostgreSQL" : "SQLite",
            storage = new
            {
                healthy = storageHealthy,
                message = storageMessage,
                basePath = storagePath,
                maxFileSize = Environment.GetEnvironmentVariable("FileStorage__MaxFileSize") ?? "10485760"
            },
            port = Environment.GetEnvironmentVariable("PORT")
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Health check failed");
        return Results.Problem("Health check failed");
    }
});

// 🔧 UPDATE: Configure for production - add cookie policy
app.UseCookiePolicy();
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
