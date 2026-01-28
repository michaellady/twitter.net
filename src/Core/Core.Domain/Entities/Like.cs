namespace Core.Domain.Entities;

public class Like
{
    public string TweetId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
