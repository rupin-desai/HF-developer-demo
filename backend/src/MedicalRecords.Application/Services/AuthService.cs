using MedicalRecords.Application.DTOs;
using MedicalRecords.Core.Entities;
using MedicalRecords.Core.Interfaces;

namespace MedicalRecords.Application.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IPasswordService _passwordService;

    public AuthService(
        IUserRepository userRepository,
        ISessionRepository sessionRepository,
        IPasswordService passwordService)
    {
        _userRepository = userRepository;
        _sessionRepository = sessionRepository;
        _passwordService = passwordService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string ipAddress, string userAgent)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(request.Email);

            if (user == null || !user.IsActive || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            // Create new session
            var session = new UserSession
            {
                UserId = user.Id,
                SessionToken = GenerateSessionToken(),
                ExpiresAt = DateTime.UtcNow.AddDays(7), // 7 days expiry
                IpAddress = ipAddress,
                UserAgent = userAgent,
                LastAccessedAt = DateTime.UtcNow
            };

            await _sessionRepository.CreateAsync(session);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            return new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                SessionToken = session.SessionToken,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Gender = user.Gender.ToString(),
                    PhoneNumber = user.PhoneNumber,
                    ProfileImage = user.ProfileImage
                }
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Login error: {ex.Message}");
            return new AuthResponse
            {
                Success = false,
                Message = "An error occurred during login"
            };
        }
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request)
    {
        try
        {
            // Check if user already exists
            if (await _userRepository.ExistsAsync(request.Email))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "User with this email already exists"
                };
            }

            // Parse gender with case-insensitive handling
            Gender gender;
            if (!Enum.TryParse<Gender>(request.Gender, true, out gender))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "Invalid gender value. Please use 'Male' or 'Female'"
                };
            }

            // Create new user
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Gender = gender,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = _passwordService.HashPassword(request.Password),
                IsActive = true
            };

            await _userRepository.CreateAsync(user);

            return new AuthResponse
            {
                Success = true,
                Message = "Registration successful"
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Signup error: {ex.Message}");
            return new AuthResponse
            {
                Success = false,
                Message = "An error occurred during registration"
            };
        }
    }

    public async Task<bool> LogoutAsync(string sessionToken)
    {
        try
        {
            await _sessionRepository.DeactivateAsync(sessionToken);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Logout error: {ex.Message}");
            return false;
        }
    }

    public async Task<UserDto?> GetCurrentUserAsync(string sessionToken)
    {
        try
        {
            var session = await _sessionRepository.GetByTokenAsync(sessionToken);

            if (session == null || !session.IsActive || session.ExpiresAt <= DateTime.UtcNow)
            {
                return null;
            }

            var user = session.User;
            if (user == null || !user.IsActive)
            {
                return null;
            }

            // Update last accessed time
            session.LastAccessedAt = DateTime.UtcNow;
            await _sessionRepository.UpdateAsync(session);

            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Gender = user.Gender.ToString(),
                PhoneNumber = user.PhoneNumber,
                ProfileImage = user.ProfileImage
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetCurrentUser error: {ex.Message}");
            return null;
        }
    }

    private string GenerateSessionToken()
    {
        return Guid.NewGuid().ToString() + DateTime.UtcNow.Ticks.ToString();
    }
}