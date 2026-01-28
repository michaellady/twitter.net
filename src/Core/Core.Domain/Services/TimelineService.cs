using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class TimelineResponse
{
    public IEnumerable<Tweet> Tweets { get; set; } = Enumerable.Empty<Tweet>();
    public string? NextCursor { get; set; }
}

public class TimelineService
{
    private readonly ITimelineRepository _timelineRepository;
    private readonly IFollowRepository _followRepository;
    private readonly ITweetRepository _tweetRepository;

    public TimelineService(
        ITimelineRepository timelineRepository,
        IFollowRepository followRepository,
        ITweetRepository tweetRepository)
    {
        _timelineRepository = timelineRepository;
        _followRepository = followRepository;
        _tweetRepository = tweetRepository;
    }

    public async Task FanoutTweetAsync(Tweet tweet)
    {
        // Get all followers of the tweet author
        var followers = await _followRepository.GetFollowersAsync(tweet.UserId);
        var followerList = followers.ToList();

        if (!followerList.Any())
        {
            return;
        }

        // Create timeline entries for each follower
        var entries = followerList.Select(followerId => new TimelineEntry
        {
            UserId = followerId,
            TweetId = tweet.TweetId,
            AuthorId = tweet.UserId,
            CreatedAt = tweet.CreatedAt
        });

        await _timelineRepository.AddEntriesAsync(entries);
    }

    public async Task<TimelineResponse> GetTimelineAsync(string userId, string? cursor = null, int limit = 20)
    {
        // Get timeline entries (tweet IDs for this user's feed)
        var result = await _timelineRepository.GetTimelineAsync(userId, cursor, limit);
        var entries = result.Entries.ToList();

        if (!entries.Any())
        {
            return new TimelineResponse
            {
                Tweets = Enumerable.Empty<Tweet>(),
                NextCursor = null
            };
        }

        // Hydrate the timeline entries with full tweet data
        var tweetIds = entries.Select(e => e.TweetId);
        var tweets = await _tweetRepository.GetByIdsAsync(tweetIds);

        // Order tweets to match the timeline order (newest first)
        var tweetMap = tweets.ToDictionary(t => t.TweetId);
        var orderedTweets = entries
            .Where(e => tweetMap.ContainsKey(e.TweetId))
            .Select(e => tweetMap[e.TweetId])
            .ToList();

        return new TimelineResponse
        {
            Tweets = orderedTweets,
            NextCursor = result.NextCursor
        };
    }

    public async Task AddToOwnTimelineAsync(Tweet tweet)
    {
        // Also add the tweet to the author's own timeline (so they see their own tweets)
        var entry = new TimelineEntry
        {
            UserId = tweet.UserId,
            TweetId = tweet.TweetId,
            AuthorId = tweet.UserId,
            CreatedAt = tweet.CreatedAt
        };

        await _timelineRepository.AddEntryAsync(entry);
    }
}
