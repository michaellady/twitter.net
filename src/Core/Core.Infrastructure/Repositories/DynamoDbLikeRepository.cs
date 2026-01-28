using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Repositories;

public class DynamoDbLikeRepository : ILikeRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private const string TableName = "Likes";
    private const string UserLikesIndex = "user-likes-index";

    public DynamoDbLikeRepository(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task<Like> AddLikeAsync(string tweetId, string userId)
    {
        var like = new Like
        {
            TweetId = tweetId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var item = new Dictionary<string, AttributeValue>
        {
            ["PK"] = new AttributeValue { S = $"TWEET#{tweetId}" },
            ["SK"] = new AttributeValue { S = $"LIKE#{userId}" },
            ["GSI1PK"] = new AttributeValue { S = $"USER#{userId}" },
            ["GSI1SK"] = new AttributeValue { S = $"LIKE#{tweetId}" },
            ["tweet_id"] = new AttributeValue { S = tweetId },
            ["user_id"] = new AttributeValue { S = userId },
            ["created_at"] = new AttributeValue { S = like.CreatedAt.ToString("O") }
        };

        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = item,
            ConditionExpression = "attribute_not_exists(PK)"
        };

        try
        {
            await _dynamoDb.PutItemAsync(request);
        }
        catch (ConditionalCheckFailedException)
        {
            // Like already exists, that's fine
        }

        return like;
    }

    public async Task RemoveLikeAsync(string tweetId, string userId)
    {
        var request = new DeleteItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["PK"] = new AttributeValue { S = $"TWEET#{tweetId}" },
                ["SK"] = new AttributeValue { S = $"LIKE#{userId}" }
            }
        };

        await _dynamoDb.DeleteItemAsync(request);
    }

    public async Task<bool> HasUserLikedAsync(string tweetId, string userId)
    {
        var request = new GetItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["PK"] = new AttributeValue { S = $"TWEET#{tweetId}" },
                ["SK"] = new AttributeValue { S = $"LIKE#{userId}" }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);
        return response.Item != null && response.Item.Count > 0;
    }

    public async Task<int> GetLikeCountAsync(string tweetId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            KeyConditionExpression = "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"TWEET#{tweetId}" },
                [":sk"] = new AttributeValue { S = "LIKE#" }
            },
            Select = Select.COUNT
        };

        var response = await _dynamoDb.QueryAsync(request);
        return response.Count;
    }

    public async Task<IEnumerable<string>> GetUserLikedTweetIdsAsync(string userId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            IndexName = UserLikesIndex,
            KeyConditionExpression = "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"USER#{userId}" },
                [":sk"] = new AttributeValue { S = "LIKE#" }
            }
        };

        var response = await _dynamoDb.QueryAsync(request);

        return response.Items.Select(item => item["tweet_id"].S);
    }
}
