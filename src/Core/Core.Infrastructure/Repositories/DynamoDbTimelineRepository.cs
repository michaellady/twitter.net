using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Repositories;

public class DynamoDbTimelineRepository : ITimelineRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private const string TableName = "Timeline";

    public DynamoDbTimelineRepository(IAmazonDynamoDB dynamoDb)
    {
        _dynamoDb = dynamoDb;
    }

    public async Task AddEntryAsync(TimelineEntry entry)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["user_id"] = new AttributeValue { S = entry.UserId },
            ["tweet_id"] = new AttributeValue { S = entry.TweetId },
            ["author_id"] = new AttributeValue { S = entry.AuthorId },
            ["created_at"] = new AttributeValue { S = entry.CreatedAt.ToString("O") }
        };

        var request = new PutItemRequest
        {
            TableName = TableName,
            Item = item
        };

        await _dynamoDb.PutItemAsync(request);
    }

    public async Task AddEntriesAsync(IEnumerable<TimelineEntry> entries)
    {
        var entriesList = entries.ToList();
        if (!entriesList.Any()) return;

        // DynamoDB BatchWriteItem supports up to 25 items per request
        const int batchSize = 25;
        var batches = entriesList
            .Select((entry, index) => new { entry, index })
            .GroupBy(x => x.index / batchSize)
            .Select(g => g.Select(x => x.entry).ToList());

        foreach (var batch in batches)
        {
            var writeRequests = batch.Select(entry => new WriteRequest
            {
                PutRequest = new PutRequest
                {
                    Item = new Dictionary<string, AttributeValue>
                    {
                        ["user_id"] = new AttributeValue { S = entry.UserId },
                        ["tweet_id"] = new AttributeValue { S = entry.TweetId },
                        ["author_id"] = new AttributeValue { S = entry.AuthorId },
                        ["created_at"] = new AttributeValue { S = entry.CreatedAt.ToString("O") }
                    }
                }
            }).ToList();

            var batchRequest = new BatchWriteItemRequest
            {
                RequestItems = new Dictionary<string, List<WriteRequest>>
                {
                    [TableName] = writeRequests
                }
            };

            await _dynamoDb.BatchWriteItemAsync(batchRequest);
        }
    }

    public async Task<TimelineQueryResult> GetTimelineAsync(string userId, string? cursor = null, int limit = 20)
    {
        var request = new QueryRequest
        {
            TableName = TableName,
            KeyConditionExpression = "user_id = :userId",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":userId"] = new AttributeValue { S = userId }
            },
            ScanIndexForward = false, // Descending order (newest first, since ULID is sortable)
            Limit = limit
        };

        // If cursor provided, start from that position (exclusive)
        if (!string.IsNullOrEmpty(cursor))
        {
            request.ExclusiveStartKey = new Dictionary<string, AttributeValue>
            {
                ["user_id"] = new AttributeValue { S = userId },
                ["tweet_id"] = new AttributeValue { S = cursor }
            };
        }

        var response = await _dynamoDb.QueryAsync(request);

        var entries = response.Items.Select(item => new TimelineEntry
        {
            UserId = item["user_id"].S,
            TweetId = item["tweet_id"].S,
            AuthorId = item["author_id"].S,
            CreatedAt = DateTime.Parse(item["created_at"].S)
        }).ToList();

        string? nextCursor = null;
        if (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0)
        {
            nextCursor = response.LastEvaluatedKey["tweet_id"].S;
        }

        return new TimelineQueryResult
        {
            Entries = entries,
            NextCursor = nextCursor
        };
    }
}
