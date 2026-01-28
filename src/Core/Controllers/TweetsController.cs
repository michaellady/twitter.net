using Core.Domain.Entities;
using Core.Domain.Interfaces;
using Core.Domain.Services;
using Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Core.Controllers;

[ApiController]
[Route("[controller]")]
public class TweetsController : ControllerBase
{
    private readonly ITweetRepository _tweetRepository;
    private readonly TimelineService _timelineService;

    public TweetsController(ITweetRepository tweetRepository, TimelineService timelineService)
    {
        _tweetRepository = tweetRepository;
        _timelineService = timelineService;
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

        // Fanout: Add to author's own timeline and to all followers' timelines
        await _timelineService.AddToOwnTimelineAsync(savedTweet);
        await _timelineService.FanoutTweetAsync(savedTweet);

        return CreatedAtAction(nameof(GetTweets), new { }, savedTweet);
    }

    [HttpGet]
    public async Task<IActionResult> GetTweets()
    {
        var tweets = await _tweetRepository.GetAllAsync();
        var sortedTweets = tweets.OrderByDescending(t => t.CreatedAt);
        return Ok(sortedTweets);
    }

    [HttpGet("{tweetId}")]
    public async Task<IActionResult> GetTweet(string tweetId)
    {
        var tweet = await _tweetRepository.GetByIdAsync(tweetId);
        if (tweet == null)
        {
            return NotFound();
        }
        return Ok(tweet);
    }
}
