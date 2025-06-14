FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files in correct order for layer caching
COPY ["src/MedicalRecords.Core/MedicalRecords.Core.csproj", "MedicalRecords.Core/"]
COPY ["src/MedicalRecords.Infrastructure/MedicalRecords.Infrastructure.csproj", "MedicalRecords.Infrastructure/"]
COPY ["src/MedicalRecords.Application/MedicalRecords.Application.csproj", "MedicalRecords.Application/"]
COPY ["src/MedicalRecords.API/MedicalRecords.API.csproj", "MedicalRecords.API/"]

# Restore dependencies
RUN dotnet restore "MedicalRecords.API/MedicalRecords.API.csproj"

# Copy all source code
COPY src/ .

# Build the application
WORKDIR "/src/MedicalRecords.API"
RUN dotnet build "MedicalRecords.API.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "MedicalRecords.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p /tmp/uploads

ENTRYPOINT ["dotnet", "MedicalRecords.API.dll"]