using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/users/{userId}")]
public class FollowController : ControllerBase
{
    private readonly FollowService _followService;

    public FollowController(FollowService followService)
    {
        _followService = followService;
    }

    [HttpPost("follow")]
    public async Task<IActionResult> Follow(string userId, [FromBody] FollowRequest request)
    {
        try
        {
            var follow = await _followService.FollowUser(request.FollowerId, userId);

            return StatusCode(201, new FollowResponse
            {
                FollowerId = follow.FollowerId,
                FollowingId = follow.FollowingId,
                CreatedAt = follow.CreatedAt
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

    [HttpDelete("follow")]
    public async Task<IActionResult> Unfollow(string userId, [FromBody] FollowRequest request)
    {
        try
        {
            await _followService.UnfollowUser(request.FollowerId, userId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("followers")]
    public async Task<IActionResult> GetFollowers(string userId)
    {
        try
        {
            var followers = await _followService.GetFollowers(userId);

            return Ok(followers.Select(f => new FollowResponse
            {
                FollowerId = f.FollowerId,
                FollowingId = f.FollowingId,
                CreatedAt = f.CreatedAt
            }));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("following")]
    public async Task<IActionResult> GetFollowing(string userId)
    {
        try
        {
            var following = await _followService.GetFollowing(userId);

            return Ok(following.Select(f => new FollowResponse
            {
                FollowerId = f.FollowerId,
                FollowingId = f.FollowingId,
                CreatedAt = f.CreatedAt
            }));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("follow-status")]
    public async Task<IActionResult> GetFollowStatus(string userId, [FromQuery] string followerId)
    {
        if (string.IsNullOrWhiteSpace(followerId))
        {
            return BadRequest(new { error = "followerId query parameter is required" });
        }

        var isFollowing = await _followService.IsFollowing(followerId, userId);

        return Ok(new FollowStatusResponse
        {
            IsFollowing = isFollowing
        });
    }

    [HttpGet("follow-counts")]
    public async Task<IActionResult> GetFollowCounts(string userId)
    {
        try
        {
            var counts = await _followService.GetFollowCounts(userId);

            return Ok(new FollowCountsResponse
            {
                FollowerCount = counts.FollowerCount,
                FollowingCount = counts.FollowingCount
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class FollowRequest
{
    public string FollowerId { get; set; } = string.Empty;
}

public class FollowResponse
{
    public string FollowerId { get; set; } = string.Empty;
    public string FollowingId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class FollowStatusResponse
{
    public bool IsFollowing { get; set; }
}

public class FollowCountsResponse
{
    public int FollowerCount { get; set; }
    public int FollowingCount { get; set; }
}
