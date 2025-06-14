using MedicalRecords.Application.DTOs;
using MedicalRecords.Core.Entities;
using MedicalRecords.Core.Interfaces;

namespace MedicalRecords.Application.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly IPasswordService _passwordService;
    private readonly IFileStorageService _fileStorageService;

    public AuthService(
        IUserRepository userRepository,
        ISessionRepository sessionRepository,
        IPasswordService passwordService,
        IFileStorageService fileStorageService)
    {
        _userRepository = userRepository;
        _sessionRepository = sessionRepository;
        _passwordService = passwordService;
        _fileStorageService = fileStorageService;
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

    public async Task<ProfileUpdateResponse> UpdateProfileAsync(ProfileUpdateRequest request, string userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return new ProfileUpdateResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Check if email is being changed and if it's already in use
            if (user.Email != request.Email)
            {
                var existingUser = await _userRepository.GetByEmailAsync(request.Email);
                if (existingUser != null && existingUser.Id != userId)
                {
                    return new ProfileUpdateResponse
                    {
                        Success = false,
                        Message = "Email is already in use by another account"
                    };
                }
            }

            // Parse gender with case-insensitive handling
            if (!Enum.TryParse<Gender>(request.Gender, true, out var gender))
            {
                return new ProfileUpdateResponse
                {
                    Success = false,
                    Message = "Invalid gender value. Please use 'Male' or 'Female'"
                };
            }

            // Handle profile picture upload
            string profileImagePath = user.ProfileImage;
            if (request.ProfilePicture != null)
            {
                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(request.ProfilePicture.ContentType.ToLower()))
                {
                    return new ProfileUpdateResponse
                    {
                        Success = false,
                        Message = "Invalid file type. Only JPEG, PNG, and GIF are allowed."
                    };
                }

                // Validate file size (5MB max)
                if (request.ProfilePicture.Length > 5 * 1024 * 1024)
                {
                    return new ProfileUpdateResponse
                    {
                        Success = false,
                        Message = "File size too large. Maximum size is 5MB."
                    };
                }

                try
                {
                    // Delete old profile picture if it exists
                    if (!string.IsNullOrEmpty(user.ProfileImage))
                    {
                        await _fileStorageService.DeleteFileAsync(user.ProfileImage);
                    }

                    // Save new profile picture
                    using var stream = request.ProfilePicture.OpenReadStream();
                    var fileName = $"profile_{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{Path.GetExtension(request.ProfilePicture.FileName)}";
                    profileImagePath = await _fileStorageService.SaveFileAsync(stream, fileName, request.ProfilePicture.ContentType, "profiles");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Profile picture upload error: {ex.Message}");
                    return new ProfileUpdateResponse
                    {
                        Success = false,
                        Message = "Failed to upload profile picture"
                    };
                }
            }
            else if (!string.IsNullOrEmpty(request.ExistingProfileImage))
            {
                // Keep existing profile image
                profileImagePath = request.ExistingProfileImage;
            }

            // Update user data
            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Gender = gender;
            user.PhoneNumber = request.PhoneNumber;
            user.ProfileImage = profileImagePath;

            await _userRepository.UpdateAsync(user);

            return new ProfileUpdateResponse
            {
                Success = true,
                Message = "Profile updated successfully",
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
            Console.WriteLine($"Profile update error: {ex.Message}");
            return new ProfileUpdateResponse
            {
                Success = false,
                Message = "An error occurred while updating profile"
            };
        }
    }

    private string GenerateSessionToken()
    {
        return Guid.NewGuid().ToString() + DateTime.UtcNow.Ticks.ToString();
    }
}