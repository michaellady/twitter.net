using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Repositories;

public class DynamoDbTweetRepository : ITweetRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private const string TableName = "Tweets";

    public DynamoDbTweetRepository(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task<Tweet> SaveAsync(Tweet tweet)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["tweet_id"] = new AttributeValue { S = tweet.TweetId },
            ["user_id"] = new AttributeValue { S = tweet.UserId },
            ["content"] = new AttributeValue { S = tweet.Content },
            ["created_at"] = new AttributeValue { S = tweet.CreatedAt.ToString("O") }
        };

        // Only add image_url if it's not null
        if (!string.IsNullOrEmpty(tweet.ImageUrl))
        {
            item["image_url"] = new AttributeValue { S = tweet.ImageUrl };
        }

        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = item
        };

        await _dynamoDb.PutItemAsync(request);

        return tweet;
    }

    public async Task<IEnumerable<Tweet>> GetAllAsync()
    {
        var request = new ScanRequest
        {
            TableName = TableName
        };

        var response = await _dynamoDb.ScanAsync(request);

        var tweets = response.Items.Select(item => new Tweet
        {
            TweetId = item["tweet_id"].S,
            UserId = item["user_id"].S,
            Content = item["content"].S,
            CreatedAt = DateTime.Parse(item["created_at"].S),
            ImageUrl = item.TryGetValue("image_url", out var imageUrl) ? imageUrl.S : null
        });

        return tweets.OrderByDescending(t => t.CreatedAt);
    }
}
