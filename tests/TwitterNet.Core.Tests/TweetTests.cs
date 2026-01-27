using TwitterNet.Core.Entities;
using Xunit;

namespace TwitterNet.Core.Tests;

public class TweetTests
{
    [Fact]
    public void Tweet_ShouldRejectContentExceeding140Characters()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var userId = "user123";
        var content = new string('a', 141); // 141 characters
        var createdAt = DateTime.UtcNow;

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            new Tweet(tweetId, userId, content, createdAt));

        Assert.Contains("140", exception.Message);
    }

    [Fact]
    public void Tweet_ShouldAcceptContentAt140Characters()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var userId = "user123";
        var content = new string('a', 140); // Exactly 140 characters
        var createdAt = DateTime.UtcNow;

        // Act
        var tweet = new Tweet(tweetId, userId, content, createdAt);

        // Assert
        Assert.Equal(content, tweet.Content);
        Assert.Equal(140, tweet.Content.Length);
    }

    [Fact]
    public void Tweet_ShouldAcceptContentUnder140Characters()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var userId = "user123";
        var content = "Hello, World!";
        var createdAt = DateTime.UtcNow;

        // Act
        var tweet = new Tweet(tweetId, userId, content, createdAt);

        // Assert
        Assert.Equal(content, tweet.Content);
    }

    [Fact]
    public void Tweet_ShouldAcceptEmptyContent()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var userId = "user123";
        var content = "";
        var createdAt = DateTime.UtcNow;

        // Act
        var tweet = new Tweet(tweetId, userId, content, createdAt);

        // Assert
        Assert.Equal("", tweet.Content);
    }

    [Fact]
    public void Tweet_ShouldRejectNullContent()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        var userId = "user123";
        string? content = null;
        var createdAt = DateTime.UtcNow;

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            new Tweet(tweetId, userId, content!, createdAt));
    }

    [Fact]
    public void Tweet_ShouldRejectNullTweetId()
    {
        // Arrange
        string? tweetId = null;
        var userId = "user123";
        var content = "Hello";
        var createdAt = DateTime.UtcNow;

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            new Tweet(tweetId!, userId, content, createdAt));
    }

    [Fact]
    public void Tweet_ShouldRejectNullUserId()
    {
        // Arrange
        var tweetId = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        string? userId = null;
        var content = "Hello";
        var createdAt = DateTime.UtcNow;

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            new Tweet(tweetId, userId!, content, createdAt));
    }
}
