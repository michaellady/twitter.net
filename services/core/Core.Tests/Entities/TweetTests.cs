using Core.Entities;
using Xunit;

namespace Core.Tests.Entities;

public class TweetTests
{
    [Fact]
    public void Validate_ShouldThrowWhenContentExceeds140Chars()
    {
        // Arrange
        var tweet = new Tweet
        {
            TweetId = "test",
            Content = new string('x', 141),
            CreatedAt = DateTime.UtcNow
        };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => tweet.Validate());
    }

    [Fact]
    public void Validate_ShouldNotThrowWhenContentIs140Chars()
    {
        // Arrange
        var tweet = new Tweet
        {
            TweetId = "test",
            Content = new string('x', 140),
            CreatedAt = DateTime.UtcNow
        };

        // Act & Assert (should not throw)
        tweet.Validate();
    }

    [Fact]
    public void Validate_ShouldNotThrowWhenContentIsEmpty()
    {
        // Arrange
        var tweet = new Tweet
        {
            TweetId = "test",
            Content = "",
            CreatedAt = DateTime.UtcNow
        };

        // Act & Assert (should not throw - empty tweets are allowed)
        tweet.Validate();
    }

    [Theory]
    [InlineData(1)]
    [InlineData(50)]
    [InlineData(100)]
    [InlineData(139)]
    [InlineData(140)]
    public void Validate_ShouldAcceptValidContentLengths(int length)
    {
        // Arrange
        var tweet = new Tweet
        {
            TweetId = "test",
            Content = new string('x', length),
            CreatedAt = DateTime.UtcNow
        };

        // Act & Assert (should not throw)
        tweet.Validate();
    }
}
