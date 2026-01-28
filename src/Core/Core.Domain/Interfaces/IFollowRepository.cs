using Core.Domain.Entities;

namespace Core.Domain.Interfaces;

public interface IFollowRepository
{
    Task<Follow> FollowAsync(string followerId, string followingId);
    Task UnfollowAsync(string followerId, string followingId);
    Task<bool> IsFollowingAsync(string followerId, string followingId);
    Task<IEnumerable<Follow>> GetFollowersAsync(string userId);
    Task<IEnumerable<Follow>> GetFollowingAsync(string userId);
    Task<int> GetFollowerCountAsync(string userId);
    Task<int> GetFollowingCountAsync(string userId);
}
