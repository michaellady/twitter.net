using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _authService.RegisterUser(
                request.Username,
                request.Password,
                request.DisplayName
            );

            return StatusCode(201, new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                DisplayName = user.DisplayName,
                CreatedAt = user.CreatedAt
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _authService.ValidateCredentials(request.Username, request.Password);

        if (user == null)
        {
            return Unauthorized(new { error = "Invalid username or password" });
        }

        return Ok(new AuthResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            DisplayName = user.DisplayName,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var user = await _authService.GetUserById(userId);

        if (user == null)
        {
            return NotFound(new { error = "User not found" });
        }

        return Ok(new AuthResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            DisplayName = user.DisplayName,
            CreatedAt = user.CreatedAt
        });
    }
}

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
