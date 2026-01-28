using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Repositories;

public class DynamoDbFollowRepository : IFollowRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private const string TableName = "Follows";
    private const string FollowersIndexName = "followers-index";

    public DynamoDbFollowRepository(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task<Follow> FollowAsync(string followerId, string followingId)
    {
        var createdAt = DateTime.UtcNow;

        var item = new Dictionary<string, AttributeValue>
        {
            ["PK"] = new AttributeValue { S = $"USER#{followerId}" },
            ["SK"] = new AttributeValue { S = $"FOLLOWS#{followingId}" },
            ["GSI1PK"] = new AttributeValue { S = $"FOLLOWING#{followingId}" },
            ["GSI1SK"] = new AttributeValue { S = $"USER#{followerId}" },
            ["follower_id"] = new AttributeValue { S = followerId },
            ["following_id"] = new AttributeValue { S = followingId },
            ["created_at"] = new AttributeValue { S = createdAt.ToString("O") }
        };

        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = item
        };

        await _dynamoDb.PutItemAsync(request);

        return new Follow
        {
            FollowerId = followerId,
            FollowingId = followingId,
            CreatedAt = createdAt
        };
    }

    public async Task UnfollowAsync(string followerId, string followingId)
    {
        var request = new DeleteItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["PK"] = new AttributeValue { S = $"USER#{followerId}" },
                ["SK"] = new AttributeValue { S = $"FOLLOWS#{followingId}" }
            }
        };

        await _dynamoDb.DeleteItemAsync(request);
    }

    public async Task<bool> IsFollowingAsync(string followerId, string followingId)
    {
        var request = new GetItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["PK"] = new AttributeValue { S = $"USER#{followerId}" },
                ["SK"] = new AttributeValue { S = $"FOLLOWS#{followingId}" }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);
        return response.IsItemSet && response.Item.Count > 0;
    }

    public async Task<IEnumerable<Follow>> GetFollowersAsync(string userId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            IndexName = FollowersIndexName,
            KeyConditionExpression = "GSI1PK = :pk",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"FOLLOWING#{userId}" }
            }
        };

        var response = await _dynamoDb.QueryAsync(request);
        return response.Items.Select(MapToFollow);
    }

    public async Task<IEnumerable<Follow>> GetFollowingAsync(string userId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            KeyConditionExpression = "PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"USER#{userId}" },
                [":sk_prefix"] = new AttributeValue { S = "FOLLOWS#" }
            }
        };

        var response = await _dynamoDb.QueryAsync(request);
        return response.Items.Select(MapToFollow);
    }

    public async Task<int> GetFollowerCountAsync(string userId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            IndexName = FollowersIndexName,
            KeyConditionExpression = "GSI1PK = :pk",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"FOLLOWING#{userId}" }
            },
            Select = Select.COUNT
        };

        var response = await _dynamoDb.QueryAsync(request);
        return response.Count;
    }

    public async Task<int> GetFollowingCountAsync(string userId)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            KeyConditionExpression = "PK = :pk AND begins_with(SK, :sk_prefix)",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":pk"] = new AttributeValue { S = $"USER#{userId}" },
                [":sk_prefix"] = new AttributeValue { S = "FOLLOWS#" }
            },
            Select = Select.COUNT
        };

        var response = await _dynamoDb.QueryAsync(request);
        return response.Count;
    }

    private static Follow MapToFollow(Dictionary<string, AttributeValue> item)
    {
        return new Follow
        {
            FollowerId = item["follower_id"].S,
            FollowingId = item["following_id"].S,
            CreatedAt = DateTime.Parse(item["created_at"].S)
        };
    }
}
