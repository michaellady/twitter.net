using Moq;
using TwitterNet.Core.Entities;
using TwitterNet.Core.Interfaces;
using TwitterNet.Core.Services;
using Xunit;

namespace TwitterNet.Core.Tests;

public class TweetServiceTests
{
    private readonly Mock<ITweetRepository> _mockRepository;
    private readonly TweetService _service;

    public TweetServiceTests()
    {
        _mockRepository = new Mock<ITweetRepository>();
        _service = new TweetService(_mockRepository.Object);
    }

    [Fact]
    public async Task CreateTweet_ShouldGenerateUlidForTweetId()
    {
        // Arrange
        var userId = "user123";
        var content = "Hello, World!";

        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .ReturnsAsync((Tweet t) => t);

        // Act
        var tweet = await _service.CreateTweetAsync(userId, content);

        // Assert
        Assert.NotNull(tweet.TweetId);
        Assert.Equal(26, tweet.TweetId.Length); // ULID is 26 characters
    }

    [Fact]
    public async Task CreateTweet_ShouldSetCreatedAtTimestamp()
    {
        // Arrange
        var userId = "user123";
        var content = "Hello, World!";
        var beforeCreate = DateTime.UtcNow;

        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .ReturnsAsync((Tweet t) => t);

        // Act
        var tweet = await _service.CreateTweetAsync(userId, content);
        var afterCreate = DateTime.UtcNow;

        // Assert
        Assert.True(tweet.CreatedAt >= beforeCreate);
        Assert.True(tweet.CreatedAt <= afterCreate);
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectContentExceeding140Characters()
    {
        // Arrange
        var userId = "user123";
        var content = new string('a', 141);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateTweetAsync(userId, content));

        Assert.Contains("140", exception.Message);
    }

    [Fact]
    public async Task CreateTweet_ShouldAcceptContentAt140Characters()
    {
        // Arrange
        var userId = "user123";
        var content = new string('a', 140);

        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .ReturnsAsync((Tweet t) => t);

        // Act
        var tweet = await _service.CreateTweetAsync(userId, content);

        // Assert
        Assert.Equal(140, tweet.Content.Length);
    }

    [Fact]
    public async Task CreateTweet_ShouldAcceptContentUnder140Characters()
    {
        // Arrange
        var userId = "user123";
        var content = "Hello!";

        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .ReturnsAsync((Tweet t) => t);

        // Act
        var tweet = await _service.CreateTweetAsync(userId, content);

        // Assert
        Assert.Equal(content, tweet.Content);
    }

    [Fact]
    public async Task CreateTweet_ShouldCallRepositorySaveAsync()
    {
        // Arrange
        var userId = "user123";
        var content = "Hello, World!";

        _mockRepository
            .Setup(r => r.SaveAsync(It.IsAny<Tweet>()))
            .ReturnsAsync((Tweet t) => t);

        // Act
        await _service.CreateTweetAsync(userId, content);

        // Assert
        _mockRepository.Verify(r => r.SaveAsync(It.IsAny<Tweet>()), Times.Once);
    }

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
        var oldTweet = new Tweet("id1", "user1", "Old tweet", DateTime.UtcNow.AddMinutes(-10));
        var newTweet = new Tweet("id2", "user2", "New tweet", DateTime.UtcNow);
        var middleTweet = new Tweet("id3", "user3", "Middle tweet", DateTime.UtcNow.AddMinutes(-5));

        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new[] { oldTweet, newTweet, middleTweet });

        // Act
        var tweets = (await _service.GetAllTweetsAsync()).ToList();

        // Assert
        Assert.Equal(3, tweets.Count);
        Assert.Equal("id2", tweets[0].TweetId); // Newest first
        Assert.Equal("id3", tweets[1].TweetId); // Middle
        Assert.Equal("id1", tweets[2].TweetId); // Oldest last
    }

    [Fact]
    public async Task GetAllTweets_ShouldCallRepositoryGetAllAsync()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(Enumerable.Empty<Tweet>());

        // Act
        await _service.GetAllTweetsAsync();

        // Assert
        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public void Constructor_ShouldThrowWhenRepositoryIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new TweetService(null!));
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectNullUserId()
    {
        // Arrange
        string? userId = null;
        var content = "Hello";

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateTweetAsync(userId!, content));
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectEmptyUserId()
    {
        // Arrange
        var userId = "";
        var content = "Hello";

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateTweetAsync(userId, content));
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectNullContent()
    {
        // Arrange
        var userId = "user123";
        string? content = null;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _service.CreateTweetAsync(userId, content!));
    }
}
