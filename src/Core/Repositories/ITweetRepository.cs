using Core.Models;

namespace Core.Repositories;

public interface ITweetRepository
{
    Task<Tweet> SaveAsync(Tweet tweet);
    Task<IEnumerable<Tweet>> GetAllAsync();
}
