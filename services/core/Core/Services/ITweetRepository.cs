using Core.Entities;

namespace Core.Services;

/// <summary>
/// Repository interface for tweet persistence.
/// </summary>
public interface ITweetRepository
{
    /// <summary>
    /// Saves a tweet to the data store.
    /// </summary>
    Task SaveAsync(Tweet tweet);

    /// <summary>
    /// Retrieves all tweets from the data store.
    /// </summary>
    Task<IEnumerable<Tweet>> GetAllAsync();
}
