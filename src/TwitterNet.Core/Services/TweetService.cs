using TwitterNet.Core.Entities;
using TwitterNet.Core.Interfaces;

namespace TwitterNet.Core.Services;

public class TweetService
{
    private readonly ITweetRepository _repository;

    public TweetService(ITweetRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<Tweet> CreateTweetAsync(string userId, string content)
    {
        if (string.IsNullOrEmpty(userId))
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

        if (content == null)
            throw new ArgumentNullException(nameof(content));

        if (content.Length > Tweet.MaxContentLength)
            throw new ArgumentException($"Content cannot exceed {Tweet.MaxContentLength} characters", nameof(content));

        var tweetId = Ulid.NewUlid().ToString();
        var createdAt = DateTime.UtcNow;

        var tweet = new Tweet(tweetId, userId, content, createdAt);
        return await _repository.SaveAsync(tweet);
    }

    public async Task<IEnumerable<Tweet>> GetAllTweetsAsync()
    {
        var tweets = await _repository.GetAllAsync();
        return tweets.OrderByDescending(t => t.CreatedAt);
    }
}
