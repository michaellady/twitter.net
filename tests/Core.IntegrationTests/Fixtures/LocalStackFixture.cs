using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace Core.IntegrationTests.Fixtures;

/// <summary>
/// Fixture for managing LocalStack DynamoDB connection and table setup for integration tests.
/// Assumes LocalStack is running on localhost:4566.
/// </summary>
public class LocalStackFixture : IAsyncLifetime
{
    public IAmazonDynamoDB DynamoDbClient { get; private set; } = null!;
    public const string TweetsTableName = "Tweets";

    private const string LocalStackEndpoint = "http://localhost:4566";

    public async Task InitializeAsync()
    {
        var config = new AmazonDynamoDBConfig
        {
            ServiceURL = LocalStackEndpoint
        };

        DynamoDbClient = new AmazonDynamoDBClient("test", "test", config);

        await CreateTweetsTableIfNotExistsAsync();
    }

    private async Task CreateTweetsTableIfNotExistsAsync()
    {
        try
        {
            await DynamoDbClient.DescribeTableAsync(TweetsTableName);
        }
        catch (ResourceNotFoundException)
        {
            var request = new CreateTableRequest
            {
                TableName = TweetsTableName,
                KeySchema = new List<KeySchemaElement>
                {
                    new KeySchemaElement("TweetId", KeyType.HASH)
                },
                AttributeDefinitions = new List<AttributeDefinition>
                {
                    new AttributeDefinition("TweetId", ScalarAttributeType.S)
                },
                BillingMode = BillingMode.PAY_PER_REQUEST
            };

            await DynamoDbClient.CreateTableAsync(request);

            // Wait for table to be active
            var describeRequest = new DescribeTableRequest { TableName = TweetsTableName };
            TableStatus status;
            do
            {
                await Task.Delay(100);
                var response = await DynamoDbClient.DescribeTableAsync(describeRequest);
                status = response.Table.TableStatus;
            } while (status != TableStatus.ACTIVE);
        }
    }

    public async Task ClearTableAsync()
    {
        var scanRequest = new ScanRequest { TableName = TweetsTableName };
        var response = await DynamoDbClient.ScanAsync(scanRequest);

        foreach (var item in response.Items)
        {
            var deleteRequest = new DeleteItemRequest
            {
                TableName = TweetsTableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "TweetId", item["TweetId"] }
                }
            };
            await DynamoDbClient.DeleteItemAsync(deleteRequest);
        }
    }

    public Task DisposeAsync()
    {
        DynamoDbClient?.Dispose();
        return Task.CompletedTask;
    }
}
