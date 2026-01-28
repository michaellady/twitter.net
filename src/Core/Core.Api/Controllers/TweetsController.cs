using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TweetsController : ControllerBase
{
    private readonly TweetService _tweetService;
    private readonly LikeService _likeService;

    public TweetsController(TweetService tweetService, LikeService likeService)
    {
        _tweetService = tweetService;
        _likeService = likeService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTweet([FromBody] CreateTweetRequest request)
    {
        try
        {
            byte[]? imageData = null;
            if (!string.IsNullOrEmpty(request.ImageBase64))
            {
                imageData = Convert.FromBase64String(request.ImageBase64);
            }

            var tweet = await _tweetService.CreateTweet(
                request.UserId,
                request.Content,
                imageData,
                request.ImageMimeType);

            return StatusCode(201, new TweetResponse
            {
                TweetId = tweet.TweetId,
                UserId = tweet.UserId,
                Content = tweet.Content,
                CreatedAt = tweet.CreatedAt,
                ImageUrl = tweet.ImageUrl,
                LikeCount = 0,
                IsLikedByCurrentUser = false
            });
        }
        catch (FormatException)
        {
            return BadRequest(new { error = "Invalid base64 image data" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTweets([FromQuery] string? currentUserId = null)
    {
        var tweets = await _tweetService.GetAllTweets();

        // Get like counts and user's liked tweets if authenticated
        var userLikedTweetIds = new HashSet<string>();
        if (!string.IsNullOrWhiteSpace(currentUserId))
        {
            var likedIds = await _likeService.GetUserLikedTweetIds(currentUserId);
            userLikedTweetIds = new HashSet<string>(likedIds);
        }

        var response = new List<TweetResponse>();
        foreach (var t in tweets)
        {
            var likeCount = await _likeService.GetLikeCount(t.TweetId);
            response.Add(new TweetResponse
            {
                TweetId = t.TweetId,
                UserId = t.UserId,
                Content = t.Content,
                CreatedAt = t.CreatedAt,
                ImageUrl = t.ImageUrl,
                LikeCount = likeCount,
                IsLikedByCurrentUser = userLikedTweetIds.Contains(t.TweetId)
            });
        }

        return Ok(response);
    }
}

public class CreateTweetRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageBase64 { get; set; }
    public string? ImageMimeType { get; set; }
}

public class TweetResponse
{
    public string TweetId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
    public int LikeCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
}
