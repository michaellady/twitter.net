namespace Core.Domain.Entities;

public class TimelineEntry
{
    public string UserId { get; set; } = string.Empty;
    public string TweetId { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
