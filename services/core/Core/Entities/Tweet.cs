namespace Core.Entities;

/// <summary>
/// Represents a tweet in the system.
/// </summary>
public class Tweet
{
    public string TweetId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Validates the tweet content.
    /// </summary>
    /// <exception cref="NotImplementedException">Not yet implemented.</exception>
    public void Validate()
    {
        throw new NotImplementedException();
    }
}
