using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private const int BcryptWorkFactor = 12;

    public AuthService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User> RegisterUser(string username, string password, string displayName)
    {
        // Validate username
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new ArgumentException("Username is required", nameof(username));
        }

        if (username.Length < 3 || username.Length > 20)
        {
            throw new ArgumentException("Username must be between 3 and 20 characters", nameof(username));
        }

        // Validate password
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required", nameof(password));
        }

        if (password.Length < 8)
        {
            throw new ArgumentException("Password must be at least 8 characters", nameof(password));
        }

        // Normalize username to lowercase
        var normalizedUsername = username.ToLowerInvariant();

        // Check if username already exists
        if (await _userRepository.UsernameExistsAsync(normalizedUsername))
        {
            throw new InvalidOperationException("Username is already taken");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, BcryptWorkFactor);

        var user = new User
        {
            UserId = Ulid.NewUlid().ToString(),
            Username = normalizedUsername,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? username : displayName,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        return await _userRepository.CreateAsync(user);
    }

    public async Task<User?> ValidateCredentials(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var normalizedUsername = username.ToLowerInvariant();
        var user = await _userRepository.GetByUsernameAsync(normalizedUsername);

        if (user == null)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
        }

        return user;
    }

    public async Task<User?> GetUserById(string userId)
    {
        return await _userRepository.GetByIdAsync(userId);
    }
}
