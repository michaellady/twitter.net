namespace TwitterNet.Core.Entities;

public class Tweet
{
    public const int MaxContentLength = 140;

    public string TweetId { get; }
    public string UserId { get; }
    public string Content { get; }
    public DateTime CreatedAt { get; }

    public Tweet(string tweetId, string userId, string content, DateTime createdAt)
    {
        if (string.IsNullOrEmpty(tweetId))
            throw new ArgumentException("Tweet ID cannot be null or empty", nameof(tweetId));

        if (string.IsNullOrEmpty(userId))
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));

        if (content == null)
            throw new ArgumentNullException(nameof(content));

        if (content.Length > MaxContentLength)
            throw new ArgumentException($"Content cannot exceed {MaxContentLength} characters", nameof(content));

        TweetId = tweetId;
        UserId = userId;
        Content = content;
        CreatedAt = createdAt;
    }
}
