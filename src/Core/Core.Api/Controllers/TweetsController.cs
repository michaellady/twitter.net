using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TweetsController : ControllerBase
{
    private readonly TweetService _tweetService;

    public TweetsController(TweetService tweetService)
    {
        _tweetService = tweetService;
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
                ImageUrl = tweet.ImageUrl
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
    public async Task<IActionResult> GetAllTweets()
    {
        var tweets = await _tweetService.GetAllTweets();
        var response = tweets.Select(t => new TweetResponse
        {
            TweetId = t.TweetId,
            UserId = t.UserId,
            Content = t.Content,
            CreatedAt = t.CreatedAt,
            ImageUrl = t.ImageUrl
        });
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
}
