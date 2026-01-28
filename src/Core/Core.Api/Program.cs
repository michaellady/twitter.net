using Amazon.DynamoDBv2;
using Amazon.Runtime;
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
    // Use LocalStack in development with dummy credentials
    var localStackUrl = builder.Configuration["AWS:ServiceURL"] ?? "http://localhost:4566";
    builder.Services.AddSingleton<IAmazonDynamoDB>(sp =>
    {
        var config = new AmazonDynamoDBConfig
        {
            ServiceURL = localStackUrl
        };
        var credentials = new BasicAWSCredentials("test", "test");
        return new AmazonDynamoDBClient(credentials, config);
    });
}
else
{
    // Use default AWS configuration in production
    builder.Services.AddAWSService<IAmazonDynamoDB>();
}

// Register application services
builder.Services.AddScoped<ITweetRepository, DynamoDbTweetRepository>();
builder.Services.AddScoped<IUserRepository, DynamoDbUserRepository>();
builder.Services.AddScoped<IFollowRepository, DynamoDbFollowRepository>();
builder.Services.AddScoped<TweetService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<FollowService>();

var app = builder.Build();

app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "core" }));

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
