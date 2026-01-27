using Core.Entities;
using Core.Services;
using Moq;
using Xunit;

namespace Core.Tests.Services;

public class TweetServiceTests
{
    private readonly Mock<ITweetRepository> _mockRepository;
    private readonly TweetService _service;

    public TweetServiceTests()
    {
        _mockRepository = new Mock<ITweetRepository>();
        _service = new TweetService(_mockRepository.Object);
    }

    #region CreateTweet Tests

    [Fact]
    public async Task CreateTweet_ShouldGenerateUlidForTweetId()
    {
        // Arrange
        var content = "Hello, world!";

        // Act
        var tweet = await _service.CreateTweetAsync(content);

        // Assert
        Assert.NotNull(tweet.TweetId);
        Assert.NotEmpty(tweet.TweetId);
        // ULID is 26 characters
        Assert.Equal(26, tweet.TweetId.Length);
    }

    [Fact]
    public async Task CreateTweet_ShouldSetCreatedAtTimestamp()
    {
        // Arrange
        var content = "Hello, world!";
        var beforeCreation = DateTime.UtcNow;

        // Act
        var tweet = await _service.CreateTweetAsync(content);
        var afterCreation = DateTime.UtcNow;

        // Assert
        Assert.True(tweet.CreatedAt >= beforeCreation);
        Assert.True(tweet.CreatedAt <= afterCreation);
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectContentExceeding140Chars()
    {
        // Arrange
        var longContent = new string('x', 141);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateTweetAsync(longContent));
    }

    [Fact]
    public async Task CreateTweet_ShouldAcceptContentUpTo140Chars()
    {
        // Arrange
        var maxContent = new string('x', 140);

        // Act
        var tweet = await _service.CreateTweetAsync(maxContent);

        // Assert
        Assert.Equal(maxContent, tweet.Content);
    }

    [Fact]
    public async Task CreateTweet_ShouldSaveTweetToRepository()
    {
        // Arrange
        var content = "Hello, world!";
        Tweet? savedTweet = null;
        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .Callback<Tweet>(t => savedTweet = t)
            .Returns(Task.CompletedTask);

        // Act
        await _service.CreateTweetAsync(content);

        // Assert
        _mockRepository.Verify(r => r.SaveAsync(It.IsAny<Tweet>()), Times.Once);
        Assert.NotNull(savedTweet);
        Assert.Equal(content, savedTweet!.Content);
    }

    #endregion

    #region GetAllTweets Tests

    [Fact]
    public async Task GetAllTweets_ShouldReturnEmptyWhenNoTweets()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(Enumerable.Empty<Tweet>());

        // Act
        var tweets = await _service.GetAllTweetsAsync();

        // Assert
        Assert.Empty(tweets);
    }

    [Fact]
    public async Task GetAllTweets_ShouldReturnTweetsNewestFirst()
    {
        // Arrange
        var oldTweet = new Tweet
        {
            TweetId = "old",
            Content = "Old tweet",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        var newTweet = new Tweet
        {
            TweetId = "new",
            Content = "New tweet",
            CreatedAt = DateTime.UtcNow
        };

        // Repository returns in arbitrary order
        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new[] { oldTweet, newTweet });

        // Act
        var tweets = (await _service.GetAllTweetsAsync()).ToList();

        // Assert
        Assert.Equal(2, tweets.Count);
        Assert.Equal("new", tweets[0].TweetId);
        Assert.Equal("old", tweets[1].TweetId);
    }

    #endregion
}
