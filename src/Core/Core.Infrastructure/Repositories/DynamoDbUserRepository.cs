using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Repositories;

public class DynamoDbUserRepository : IUserRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private const string TableName = "Users";

    public DynamoDbUserRepository(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task<User> CreateAsync(User user)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["PK"] = new AttributeValue { S = $"USER#{user.UserId}" },
            ["SK"] = new AttributeValue { S = "PROFILE" },
            ["user_id"] = new AttributeValue { S = user.UserId },
            ["username"] = new AttributeValue { S = user.Username },
            ["display_name"] = new AttributeValue { S = user.DisplayName },
            ["password_hash"] = new AttributeValue { S = user.PasswordHash },
            ["created_at"] = new AttributeValue { S = user.CreatedAt.ToString("O") }
        };

        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = item,
            ConditionExpression = "attribute_not_exists(PK)"
        };

        await _dynamoDb.PutItemAsync(request);
        return user;
    }

    public async Task<User?> GetByIdAsync(string userId)
    {
        var request = new GetItemRequest
        {
            TableName = TableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["PK"] = new AttributeValue { S = $"USER#{userId}" },
                ["SK"] = new AttributeValue { S = "PROFILE" }
            }
        };

        var response = await _dynamoDb.GetItemAsync(request);

        if (!response.IsItemSet || response.Item.Count == 0)
        {
            return null;
        }

        return MapToUser(response.Item);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            IndexName = "username-index",
            KeyConditionExpression = "username = :username",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":username"] = new AttributeValue { S = username }
            }
        };

        var response = await _dynamoDb.QueryAsync(request);

        if (response.Items.Count == 0)
        {
            return null;
        }

        return MapToUser(response.Items[0]);
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        var user = await GetByUsernameAsync(username);
        return user != null;
    }

    private static User MapToUser(Dictionary<string, AttributeValue> item)
    {
        return new User
        {
            UserId = item["user_id"].S,
            Username = item["username"].S,
            DisplayName = item["display_name"].S,
            PasswordHash = item["password_hash"].S,
            CreatedAt = DateTime.Parse(item["created_at"].S)
        };
    }
}
