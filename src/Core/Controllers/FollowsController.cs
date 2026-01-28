using Core.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers;

public class FollowRequest
{
    public string FollowerId { get; set; } = string.Empty;
    public string FollowingId { get; set; } = string.Empty;
}

[ApiController]
[Route("[controller]")]
public class FollowsController : ControllerBase
{
    private readonly IFollowRepository _followRepository;

    public FollowsController(IFollowRepository followRepository)
    {
        _followRepository = followRepository;
    }

    [HttpPost]
    public async Task<IActionResult> Follow([FromBody] FollowRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FollowerId) || string.IsNullOrWhiteSpace(request.FollowingId))
        {
            return BadRequest("Both follower and following IDs are required");
        }

        if (request.FollowerId == request.FollowingId)
        {
            return BadRequest("Cannot follow yourself");
        }

        var follow = await _followRepository.AddFollowAsync(request.FollowerId, request.FollowingId);
        return Ok(new { following = true, createdAt = follow.CreatedAt });
    }

    [HttpDelete]
    public async Task<IActionResult> Unfollow([FromBody] FollowRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FollowerId) || string.IsNullOrWhiteSpace(request.FollowingId))
        {
            return BadRequest("Both follower and following IDs are required");
        }

        await _followRepository.RemoveFollowAsync(request.FollowerId, request.FollowingId);
        return Ok(new { following = false });
    }

    [HttpGet("{userId}/followers")]
    public async Task<IActionResult> GetFollowers(string userId)
    {
        var followers = await _followRepository.GetFollowersAsync(userId);
        return Ok(new { followers = followers });
    }

    [HttpGet("{userId}/following")]
    public async Task<IActionResult> GetFollowing(string userId)
    {
        var following = await _followRepository.GetFollowingAsync(userId);
        return Ok(new { following = following });
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckFollowing(
        [FromQuery] string followerId,
        [FromQuery] string followingId)
    {
        if (string.IsNullOrWhiteSpace(followerId) || string.IsNullOrWhiteSpace(followingId))
        {
            return BadRequest("Both follower and following IDs are required");
        }

        var isFollowing = await _followRepository.IsFollowingAsync(followerId, followingId);
        return Ok(new { isFollowing = isFollowing });
    }
}
