using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/tweets/{tweetId}/like")]
public class LikesController : ControllerBase
{
    private readonly LikeService _likeService;

    public LikesController(LikeService likeService)
    {
        _likeService = likeService;
    }

    [HttpPost]
    public async Task<IActionResult> LikeTweet(string tweetId, [FromBody] LikeRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "User ID is required" });
            }

            var (liked, likeCount) = await _likeService.LikeTweet(tweetId, request.UserId);
            return Ok(new LikeResponse { Liked = liked, LikeCount = likeCount });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> UnlikeTweet(string tweetId, [FromBody] LikeRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest(new { error = "User ID is required" });
            }

            var (liked, likeCount) = await _likeService.UnlikeTweet(tweetId, request.UserId);
            return Ok(new LikeResponse { Liked = liked, LikeCount = likeCount });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetLikeStatus(string tweetId, [FromQuery] string? userId)
    {
        var likeCount = await _likeService.GetLikeCount(tweetId);
        var isLiked = false;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            isLiked = await _likeService.HasUserLiked(tweetId, userId);
        }

        return Ok(new LikeResponse { Liked = isLiked, LikeCount = likeCount });
    }
}

public class LikeRequest
{
    public string UserId { get; set; } = string.Empty;
}

public class LikeResponse
{
    public bool Liked { get; set; }
    public int LikeCount { get; set; }
}
