using Core.Domain.Entities;
using Core.Domain.Interfaces;

namespace Core.Domain.Services;

public class TweetService
{
    private readonly ITweetRepository _repository;
    private readonly IImageStorageService? _imageStorage;

    public TweetService(ITweetRepository repository, IImageStorageService? imageStorage = null)
    {
        _repository = repository;
        _imageStorage = imageStorage;
    }

    public async Task<Tweet> CreateTweet(string userId, string content, byte[]? imageData = null, string? imageMimeType = null)
    {
        if (content.Length > 140)
        {
            throw new ArgumentException("Content exceeds 140 characters", nameof(content));
        }

        var tweetId = Ulid.NewUlid().ToString();
        string? imageUrl = null;

        // Handle image upload if provided
        if (imageData != null && imageMimeType != null && _imageStorage != null)
        {
            if (!_imageStorage.IsValidImageType(imageMimeType))
            {
                throw new ArgumentException("Invalid image type. Allowed types: jpg, png, gif, webp", nameof(imageMimeType));
            }

            if (!_imageStorage.IsValidImageSize(imageData.Length))
            {
                throw new ArgumentException("Image size exceeds maximum allowed (5MB)", nameof(imageData));
            }

            imageUrl = await _imageStorage.UploadImageAsync(imageData, tweetId, imageMimeType);
        }

        var tweet = new Tweet
        {
            TweetId = tweetId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            ImageUrl = imageUrl
        };

        return await _repository.SaveAsync(tweet);
    }

    public async Task<IEnumerable<Tweet>> GetAllTweets()
    {
        var tweets = await _repository.GetAllAsync();
        return tweets.OrderByDescending(t => t.CreatedAt);
    }
}
