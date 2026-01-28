using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class FollowService
{
    private readonly IFollowRepository _followRepository;
    private readonly IUserRepository _userRepository;

    public FollowService(IFollowRepository followRepository, IUserRepository userRepository)
    {
        _followRepository = followRepository;
        _userRepository = userRepository;
    }

    public async Task<Follow> FollowUser(string followerId, string followingId)
    {
        if (string.IsNullOrWhiteSpace(followerId))
        {
            throw new ArgumentException("Follower ID is required", nameof(followerId));
        }

        if (string.IsNullOrWhiteSpace(followingId))
        {
            throw new ArgumentException("Following ID is required", nameof(followingId));
        }

        if (followerId == followingId)
        {
            throw new ArgumentException("Users cannot follow themselves");
        }

        // Verify target user exists
        var targetUser = await _userRepository.GetByIdAsync(followingId);
        if (targetUser == null)
        {
            throw new ArgumentException("User to follow does not exist");
        }

        // Check if already following
        var isFollowing = await _followRepository.IsFollowingAsync(followerId, followingId);
        if (isFollowing)
        {
            throw new InvalidOperationException("Already following this user");
        }

        return await _followRepository.FollowAsync(followerId, followingId);
    }

    public async Task UnfollowUser(string followerId, string followingId)
    {
        if (string.IsNullOrWhiteSpace(followerId))
        {
            throw new ArgumentException("Follower ID is required", nameof(followerId));
        }

        if (string.IsNullOrWhiteSpace(followingId))
        {
            throw new ArgumentException("Following ID is required", nameof(followingId));
        }

        await _followRepository.UnfollowAsync(followerId, followingId);
    }

    public async Task<bool> IsFollowing(string followerId, string followingId)
    {
        if (string.IsNullOrWhiteSpace(followerId) || string.IsNullOrWhiteSpace(followingId))
        {
            return false;
        }

        return await _followRepository.IsFollowingAsync(followerId, followingId);
    }

    public async Task<IEnumerable<Follow>> GetFollowers(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        return await _followRepository.GetFollowersAsync(userId);
    }

    public async Task<IEnumerable<Follow>> GetFollowing(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        return await _followRepository.GetFollowingAsync(userId);
    }

    public async Task<FollowCounts> GetFollowCounts(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        var followerCount = await _followRepository.GetFollowerCountAsync(userId);
        var followingCount = await _followRepository.GetFollowingCountAsync(userId);

        return new FollowCounts
        {
            FollowerCount = followerCount,
            FollowingCount = followingCount
        };
    }
}

public class FollowCounts
{
    public int FollowerCount { get; set; }
    public int FollowingCount { get; set; }
}
