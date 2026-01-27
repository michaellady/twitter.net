using Core.Entities;

namespace Core.Services;

/// <summary>
/// Service for managing tweets.
/// </summary>
public class TweetService
{
    private readonly ITweetRepository _repository;

    public TweetService(ITweetRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Creates a new tweet with the given content.
    /// </summary>
    /// <param name="content">The tweet content.</param>
    /// <returns>The created tweet.</returns>
    /// <exception cref="NotImplementedException">Not yet implemented.</exception>
    public Task<Tweet> CreateTweetAsync(string content)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Gets all tweets, ordered by newest first.
    /// </summary>
    /// <returns>A collection of tweets.</returns>
    /// <exception cref="NotImplementedException">Not yet implemented.</exception>
    public Task<IEnumerable<Tweet>> GetAllTweetsAsync()
    {
        throw new NotImplementedException();
    }
}
