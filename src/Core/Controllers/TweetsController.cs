using Core.Models;
using Core.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers;

[ApiController]
[Route("[controller]")]
public class TweetsController : ControllerBase
{
    private readonly ITweetRepository _tweetRepository;

    public TweetsController(ITweetRepository tweetRepository)
    {
        _tweetRepository = tweetRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTweet([FromBody] CreateTweetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("Content cannot be empty");
        }

        if (request.Content.Length > 140)
        {
            return BadRequest("Content exceeds 140 character limit");
        }

        var tweet = new Tweet
        {
            TweetId = Ulid.NewUlid().ToString(),
            UserId = request.UserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        var savedTweet = await _tweetRepository.SaveAsync(tweet);
        return CreatedAtAction(nameof(GetTweets), new { }, savedTweet);
    }

    [HttpGet]
    public async Task<IActionResult> GetTweets()
    {
        var tweets = await _tweetRepository.GetAllAsync();
        var sortedTweets = tweets.OrderByDescending(t => t.CreatedAt);
        return Ok(sortedTweets);
    }
}
