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

    public async Task<Tweet?> GetByIdAsync(string tweetId)
    {
        var request = new GetItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["tweet_id"] = new AttributeValue { S = tweetId }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);

        if (response.Item == null || response.Item.Count == 0)
        {
            return null;
        }

        return new Tweet
        {
            TweetId = response.Item["tweet_id"].S,
            UserId = response.Item["user_id"].S,
            Content = response.Item["content"].S,
            CreatedAt = DateTime.Parse(response.Item["created_at"].S)
        };
    }

    public async Task<IEnumerable<Tweet>> GetByIdsAsync(IEnumerable<string> tweetIds)
    {
        var tweetIdsList = tweetIds.ToList();
        if (!tweetIdsList.Any())
        {
            return Enumerable.Empty<Tweet>();
        }

        // DynamoDB BatchGetItem supports up to 100 items per request
        const int batchSize = 100;
        var results = new List<Tweet>();

        var batches = tweetIdsList
            .Select((id, index) => new { id, index })
            .GroupBy(x => x.index / batchSize)
            .Select(g => g.Select(x => x.id).ToList());

        foreach (var batch in batches)
        {
            var keys = batch.Select(id => new Dictionary<string, AttributeValue>
            {
                ["tweet_id"] = new AttributeValue { S = id }
            }).ToList();

            var request = new BatchGetItemRequest
            {
                RequestItems = new Dictionary<string, KeysAndAttributes>
                {
                    [TableName] = new KeysAndAttributes { Keys = keys }
                }
            };

            var response = await _dynamoDb.BatchGetItemAsync(request);

            if (response.Responses.TryGetValue(TableName, out var items))
            {
                var tweets = items.Select(item => new Tweet
                {
                    TweetId = item["tweet_id"].S,
                    UserId = item["user_id"].S,
                    Content = item["content"].S,
                    CreatedAt = DateTime.Parse(item["created_at"].S)
                });
                results.AddRange(tweets);
            }
        }

        // Preserve the order of the input tweetIds
        var tweetMap = results.ToDictionary(t => t.TweetId);
        return tweetIdsList
            .Where(id => tweetMap.ContainsKey(id))
            .Select(id => tweetMap[id]);
    }
}
