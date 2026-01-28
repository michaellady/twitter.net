using Core.Domain.Entities;

namespace Core.Domain.Interfaces;

public interface ILikeRepository
{
    Task<Like> AddLikeAsync(string tweetId, string userId);
    Task RemoveLikeAsync(string tweetId, string userId);
    Task<bool> HasUserLikedAsync(string tweetId, string userId);
    Task<int> GetLikeCountAsync(string tweetId);
    Task<IEnumerable<string>> GetUserLikedTweetIdsAsync(string userId);
}
