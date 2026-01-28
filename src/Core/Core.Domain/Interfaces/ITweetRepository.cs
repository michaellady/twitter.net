using Core.Domain.Entities;

namespace Core.Domain.Interfaces;

public interface ITweetRepository
{
    Task<Tweet> SaveAsync(Tweet tweet);
    Task<IEnumerable<Tweet>> GetAllAsync();
    Task<Tweet?> GetByIdAsync(string tweetId);
    Task<IEnumerable<Tweet>> GetByIdsAsync(IEnumerable<string> tweetIds);
}
