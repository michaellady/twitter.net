using Amazon.DynamoDBv2;
using Core.Domain.Interfaces;
using Core.Domain.Services;
using Core.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure AWS DynamoDB
if (builder.Environment.IsDevelopment())
{
    // Use LocalStack in development
    var localStackUrl = builder.Configuration["AWS:ServiceURL"] ?? "http://localhost:4566";
    builder.Services.AddSingleton<IAmazonDynamoDB>(sp =>
    {
        var config = new AmazonDynamoDBConfig
        {
            ServiceURL = localStackUrl
        };
        return new AmazonDynamoDBClient(config);
    });
}
else
{
    // Use default AWS configuration in production
    builder.Services.AddAWSService<IAmazonDynamoDB>();
}

// Register application services
builder.Services.AddScoped<ITweetRepository, DynamoDbTweetRepository>();
builder.Services.AddScoped<TweetService>();

var app = builder.Build();

app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
