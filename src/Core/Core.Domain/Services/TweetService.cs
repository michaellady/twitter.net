using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class TweetService
{
    private readonly ITweetRepository _repository;

    public TweetService(ITweetRepository repository)
    {
        _repository = repository;
    }

    public async Task<Tweet> CreateTweet(string userId, string content)
    {
        if (content.Length > 140)
        {
            throw new ArgumentException("Content exceeds 140 characters", nameof(content));
        }

        var tweet = new Tweet
        {
            TweetId = Ulid.NewUlid().ToString(),
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        return await _repository.SaveAsync(tweet);
    }

    public async Task<IEnumerable<Tweet>> GetAllTweets()
    {
        var tweets = await _repository.GetAllAsync();
        return tweets.OrderByDescending(t => t.CreatedAt);
    }
}
