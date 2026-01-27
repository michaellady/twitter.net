using Core.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Core.IntegrationTests.Fixtures;

/// <summary>
/// Custom WebApplicationFactory for Core API integration tests.
/// Configures the test server with LocalStack DynamoDB and test-specific services.
/// </summary>
public class CoreApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly LocalStackFixture _localStackFixture = new();

    public LocalStackFixture LocalStack => _localStackFixture;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove any existing ITweetRepository registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ITweetRepository));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Register the NotImplemented repository (RED phase)
            // The GREEN phase will replace this with DynamoDbTweetRepository
            services.AddSingleton<ITweetRepository, NotImplementedTweetRepository>();
        });
    }

    public async Task InitializeAsync()
    {
        await _localStackFixture.InitializeAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _localStackFixture.DisposeAsync();
    }
}
