using System.Net;
using System.Net.Http.Json;
using Core.IntegrationTests.Fixtures;
using Core.Models;

namespace Core.IntegrationTests.Tests;

/// <summary>
/// Integration tests for GET /tweets endpoint.
/// These tests are RED - they will fail until the DynamoDB repository is implemented.
/// </summary>
[Collection("CoreApi")]
public class GetTweetsTests : IAsyncLifetime
{
    private readonly CoreApiFactory _factory;
    private readonly HttpClient _client;

    public GetTweetsTests(CoreApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.LocalStack.ClearTableAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task GetTweets_ShouldReturnEmptyArray_WhenNoTweets()
    {
        // Act
        var response = await _client.GetAsync("/tweets");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tweets = await response.Content.ReadFromJsonAsync<List<Tweet>>();
        Assert.NotNull(tweets);
        Assert.Empty(tweets);
    }

    [Fact]
    public async Task GetTweets_ShouldReturnAllTweets_NewestFirst()
    {
        // Arrange - Create multiple tweets
        var tweet1 = new CreateTweetRequest { UserId = "user1", Content = "First tweet" };
        var tweet2 = new CreateTweetRequest { UserId = "user2", Content = "Second tweet" };
        var tweet3 = new CreateTweetRequest { UserId = "user3", Content = "Third tweet" };

        await _client.PostAsJsonAsync("/tweets", tweet1);
        await Task.Delay(10); // Ensure different timestamps
        await _client.PostAsJsonAsync("/tweets", tweet2);
        await Task.Delay(10);
        await _client.PostAsJsonAsync("/tweets", tweet3);

        // Act
        var response = await _client.GetAsync("/tweets");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tweets = await response.Content.ReadFromJsonAsync<List<Tweet>>();
        Assert.NotNull(tweets);
        Assert.Equal(3, tweets.Count);

        // Verify newest first ordering
        Assert.Equal("Third tweet", tweets[0].Content);
        Assert.Equal("Second tweet", tweets[1].Content);
        Assert.Equal("First tweet", tweets[2].Content);

        // Verify timestamps are in descending order
        Assert.True(tweets[0].CreatedAt >= tweets[1].CreatedAt);
        Assert.True(tweets[1].CreatedAt >= tweets[2].CreatedAt);
    }

    [Fact]
    public async Task GetTweets_ShouldReturnTweets_WithAllFields()
    {
        // Arrange
        var request = new CreateTweetRequest
        {
            UserId = "fieldTestUser",
            Content = "Testing all fields are returned"
        };
        var createResponse = await _client.PostAsJsonAsync("/tweets", request);
        var createdTweet = await createResponse.Content.ReadFromJsonAsync<Tweet>();
        Assert.NotNull(createdTweet);

        // Act
        var response = await _client.GetAsync("/tweets");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tweets = await response.Content.ReadFromJsonAsync<List<Tweet>>();
        Assert.NotNull(tweets);
        Assert.Single(tweets);

        var tweet = tweets[0];
        Assert.Equal(createdTweet.TweetId, tweet.TweetId);
        Assert.Equal("fieldTestUser", tweet.UserId);
        Assert.Equal("Testing all fields are returned", tweet.Content);
        Assert.True(tweet.CreatedAt > DateTime.MinValue);
    }
}
