using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Core.IntegrationTests.Fixtures;
using Core.Models;

namespace Core.IntegrationTests.Tests;

/// <summary>
/// Integration tests for POST /tweets endpoint.
/// These tests are RED - they will fail until the DynamoDB repository is implemented.
/// </summary>
[Collection("CoreApi")]
public class PostTweetsTests : IAsyncLifetime
{
    private readonly CoreApiFactory _factory;
    private readonly HttpClient _client;

    public PostTweetsTests(CoreApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.LocalStack.ClearTableAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CreateTweet_ShouldReturn201_WithCreatedTweet()
    {
        // Arrange
        var request = new CreateTweetRequest
        {
            UserId = "user123",
            Content = "Hello, Twitter.NET!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/tweets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var tweet = await response.Content.ReadFromJsonAsync<Tweet>();
        Assert.NotNull(tweet);
        Assert.NotEmpty(tweet.TweetId);
        Assert.Equal("user123", tweet.UserId);
        Assert.Equal("Hello, Twitter.NET!", tweet.Content);
        Assert.True(tweet.CreatedAt > DateTime.MinValue);
    }

    [Fact]
    public async Task CreateTweet_ShouldPersistTweet_ToDynamoDB()
    {
        // Arrange
        var request = new CreateTweetRequest
        {
            UserId = "user456",
            Content = "This tweet should be persisted"
        };

        // Act
        var createResponse = await _client.PostAsJsonAsync("/tweets", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdTweet = await createResponse.Content.ReadFromJsonAsync<Tweet>();
        Assert.NotNull(createdTweet);

        // Verify persistence by fetching all tweets
        var getResponse = await _client.GetAsync("/tweets");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var tweets = await getResponse.Content.ReadFromJsonAsync<List<Tweet>>();
        Assert.NotNull(tweets);
        Assert.Contains(tweets, t => t.TweetId == createdTweet.TweetId);
    }

    [Fact]
    public async Task CreateTweet_ShouldRejectContent_ExceedingMaxLength()
    {
        // Arrange
        var longContent = new string('x', 141); // 141 chars, exceeds 140 limit
        var request = new CreateTweetRequest
        {
            UserId = "user789",
            Content = longContent
        };

        // Act
        var response = await _client.PostAsJsonAsync("/tweets", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTweet_ShouldAcceptContent_AtMaxLength()
    {
        // Arrange
        var maxContent = new string('x', 140); // Exactly 140 chars
        var request = new CreateTweetRequest
        {
            UserId = "user101",
            Content = maxContent
        };

        // Act
        var response = await _client.PostAsJsonAsync("/tweets", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var tweet = await response.Content.ReadFromJsonAsync<Tweet>();
        Assert.NotNull(tweet);
        Assert.Equal(140, tweet.Content.Length);
    }

    [Fact]
    public async Task CreateTweet_ShouldReturnTweet_WithGeneratedIdAndTimestamp()
    {
        // Arrange
        var request = new CreateTweetRequest
        {
            UserId = "user202",
            Content = "Testing ID and timestamp generation"
        };

        // Act
        var beforeCreate = DateTime.UtcNow;
        var response = await _client.PostAsJsonAsync("/tweets", request);
        var afterCreate = DateTime.UtcNow;

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var tweet = await response.Content.ReadFromJsonAsync<Tweet>();
        Assert.NotNull(tweet);

        // Verify ULID was generated (26 chars, alphanumeric)
        Assert.Equal(26, tweet.TweetId.Length);
        Assert.Matches("^[0-9A-Z]+$", tweet.TweetId.ToUpperInvariant());

        // Verify timestamp is reasonable
        Assert.True(tweet.CreatedAt >= beforeCreate.AddSeconds(-1));
        Assert.True(tweet.CreatedAt <= afterCreate.AddSeconds(1));
    }
}
