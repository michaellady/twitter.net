using Core.Domain.Entities;
using Core.Domain.Interfaces;
using Core.Domain.Services;
using Moq;
using Xunit;

namespace Core.IntegrationTests.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _mockRepository = new Mock<IUserRepository>();
        _authService = new AuthService(_mockRepository.Object);
    }

    [Fact]
    public async Task RegisterUser_ShouldCreateUserWithHashedPassword()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.UsernameExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var user = await _authService.RegisterUser("testuser", "password123", "Test User");

        // Assert
        Assert.NotNull(user);
        Assert.Equal("testuser", user.Username);
        Assert.Equal("Test User", user.DisplayName);
        Assert.NotEqual("password123", user.PasswordHash); // Password should be hashed
        Assert.True(BCrypt.Net.BCrypt.Verify("password123", user.PasswordHash));
    }

    [Fact]
    public async Task RegisterUser_ShouldNormalizeUsernameToLowercase()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.UsernameExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var user = await _authService.RegisterUser("TestUser", "password123", "Test User");

        // Assert
        Assert.Equal("testuser", user.Username);
    }

    [Fact]
    public async Task RegisterUser_ShouldGenerateUlidForUserId()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.UsernameExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var user = await _authService.RegisterUser("testuser", "password123", "Test User");

        // Assert
        Assert.NotNull(user.UserId);
        Assert.Equal(26, user.UserId.Length); // ULID is 26 characters
    }

    [Fact]
    public async Task RegisterUser_ShouldThrowWhenUsernameExists()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.UsernameExistsAsync("existinguser"))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterUser("existinguser", "password123", "Test User"));
        Assert.Equal("Username is already taken", exception.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public async Task RegisterUser_ShouldThrowWhenUsernameIsEmpty(string? username)
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _authService.RegisterUser(username!, "password123", "Test User"));
    }

    [Theory]
    [InlineData("ab")] // Too short
    [InlineData("abcdefghijklmnopqrstu")] // Too long (21 chars)
    public async Task RegisterUser_ShouldThrowWhenUsernameInvalidLength(string username)
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _authService.RegisterUser(username, "password123", "Test User"));
        Assert.Contains("between 3 and 20", exception.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public async Task RegisterUser_ShouldThrowWhenPasswordIsEmpty(string? password)
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _authService.RegisterUser("testuser", password!, "Test User"));
    }

    [Fact]
    public async Task RegisterUser_ShouldThrowWhenPasswordTooShort()
    {
        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _authService.RegisterUser("testuser", "short", "Test User"));
        Assert.Contains("at least 8", exception.Message);
    }

    [Fact]
    public async Task RegisterUser_ShouldUseUsernameAsDisplayNameWhenNotProvided()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.UsernameExistsAsync(It.IsAny<string>()))
            .ReturnsAsync(false);
        _mockRepository
            .Setup(r => r.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync((User u) => u);

        // Act
        var user = await _authService.RegisterUser("testuser", "password123", "");

        // Assert
        Assert.Equal("testuser", user.DisplayName);
    }

    [Fact]
    public async Task ValidateCredentials_ShouldReturnUserWhenCredentialsValid()
    {
        // Arrange
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("password123");
        var existingUser = new User
        {
            UserId = "user-123",
            Username = "testuser",
            DisplayName = "Test User",
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };

        _mockRepository
            .Setup(r => r.GetByUsernameAsync("testuser"))
            .ReturnsAsync(existingUser);

        // Act
        var user = await _authService.ValidateCredentials("testuser", "password123");

        // Assert
        Assert.NotNull(user);
        Assert.Equal("user-123", user.UserId);
    }

    [Fact]
    public async Task ValidateCredentials_ShouldReturnNullWhenUserNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act
        var user = await _authService.ValidateCredentials("nonexistent", "password123");

        // Assert
        Assert.Null(user);
    }

    [Fact]
    public async Task ValidateCredentials_ShouldReturnNullWhenPasswordWrong()
    {
        // Arrange
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword");
        var existingUser = new User
        {
            UserId = "user-123",
            Username = "testuser",
            PasswordHash = passwordHash
        };

        _mockRepository
            .Setup(r => r.GetByUsernameAsync("testuser"))
            .ReturnsAsync(existingUser);

        // Act
        var user = await _authService.ValidateCredentials("testuser", "wrongpassword");

        // Assert
        Assert.Null(user);
    }

    [Theory]
    [InlineData("", "password")]
    [InlineData("username", "")]
    [InlineData(null, "password")]
    [InlineData("username", null)]
    public async Task ValidateCredentials_ShouldReturnNullWhenEmptyInput(string? username, string? password)
    {
        // Act
        var user = await _authService.ValidateCredentials(username!, password!);

        // Assert
        Assert.Null(user);
    }

    [Fact]
    public async Task ValidateCredentials_ShouldNormalizeUsername()
    {
        // Arrange
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("password123");
        var existingUser = new User
        {
            UserId = "user-123",
            Username = "testuser",
            PasswordHash = passwordHash
        };

        _mockRepository
            .Setup(r => r.GetByUsernameAsync("testuser"))
            .ReturnsAsync(existingUser);

        // Act
        var user = await _authService.ValidateCredentials("TestUser", "password123");

        // Assert
        Assert.NotNull(user);
        _mockRepository.Verify(r => r.GetByUsernameAsync("testuser"), Times.Once);
    }

    [Fact]
    public async Task GetUserById_ShouldReturnUserWhenFound()
    {
        // Arrange
        var existingUser = new User
        {
            UserId = "user-123",
            Username = "testuser",
            DisplayName = "Test User"
        };

        _mockRepository
            .Setup(r => r.GetByIdAsync("user-123"))
            .ReturnsAsync(existingUser);

        // Act
        var user = await _authService.GetUserById("user-123");

        // Assert
        Assert.NotNull(user);
        Assert.Equal("user-123", user.UserId);
    }

    [Fact]
    public async Task GetUserById_ShouldReturnNullWhenNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act
        var user = await _authService.GetUserById("nonexistent");

        // Assert
        Assert.Null(user);
    }
}
