using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class LikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly ITweetRepository _tweetRepository;

    public LikeService(ILikeRepository likeRepository, ITweetRepository tweetRepository)
    {
        _likeRepository = likeRepository;
        _tweetRepository = tweetRepository;
    }

    public async Task<(bool liked, int likeCount)> LikeTweet(string tweetId, string userId)
    {
        if (string.IsNullOrWhiteSpace(tweetId))
        {
            throw new ArgumentException("Tweet ID is required", nameof(tweetId));
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        await _likeRepository.AddLikeAsync(tweetId, userId);
        var likeCount = await _likeRepository.GetLikeCountAsync(tweetId);

        return (true, likeCount);
    }

    public async Task<(bool liked, int likeCount)> UnlikeTweet(string tweetId, string userId)
    {
        if (string.IsNullOrWhiteSpace(tweetId))
        {
            throw new ArgumentException("Tweet ID is required", nameof(tweetId));
        }

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        await _likeRepository.RemoveLikeAsync(tweetId, userId);
        var likeCount = await _likeRepository.GetLikeCountAsync(tweetId);

        return (false, likeCount);
    }

    public async Task<bool> HasUserLiked(string tweetId, string userId)
    {
        return await _likeRepository.HasUserLikedAsync(tweetId, userId);
    }

    public async Task<int> GetLikeCount(string tweetId)
    {
        return await _likeRepository.GetLikeCountAsync(tweetId);
    }

    public async Task<IEnumerable<string>> GetUserLikedTweetIds(string userId)
    {
        return await _likeRepository.GetUserLikedTweetIdsAsync(userId);
    }
}
