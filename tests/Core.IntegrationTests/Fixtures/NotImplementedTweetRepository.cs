using Core.Models;
using Core.Repositories;

namespace Core.IntegrationTests.Fixtures;

/// <summary>
/// Stub repository that throws NotImplementedException for all operations.
/// This ensures tests are RED until the actual DynamoDB implementation is complete.
/// </summary>
public class NotImplementedTweetRepository : ITweetRepository
{
    public Task<Tweet> SaveAsync(Tweet tweet)
    {
        throw new NotImplementedException("DynamoDB repository not yet implemented");
    }

    public Task<IEnumerable<Tweet>> GetAllAsync()
    {
        throw new NotImplementedException("DynamoDB repository not yet implemented");
    }
}
