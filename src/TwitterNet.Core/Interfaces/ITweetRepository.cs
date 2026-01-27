using TwitterNet.Core.Entities;

namespace TwitterNet.Core.Interfaces;

public interface ITweetRepository
{
    Task<Tweet> SaveAsync(Tweet tweet);
    Task<IEnumerable<Tweet>> GetAllAsync();
}
