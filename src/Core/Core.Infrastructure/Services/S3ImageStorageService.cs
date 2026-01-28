using Amazon.S3;
using Amazon.S3.Model;
using Core.Domain.Interfaces;

namespace Core.Infrastructure.Services;

public class S3ImageStorageService : IImageStorageService
{
    private readonly IAmazonS3 _s3Client;
    private const string BucketName = "twitter-net-media";
    private const int MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB
    private static readonly HashSet<string> AllowedMimeTypes = new()
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    public S3ImageStorageService(IAmazonS3 s3Client)
    {
        _s3Client = s3Client;
    }

    public async Task<string> UploadImageAsync(byte[] imageData, string tweetId, string mimeType)
    {
        var extension = GetExtensionFromMimeType(mimeType);
        var key = $"tweets/{tweetId}{extension}";

        using var stream = new MemoryStream(imageData);
        var request = new PutObjectRequest
        {
            BucketName = BucketName,
            Key = key,
            InputStream = stream,
            ContentType = mimeType
        };

        await _s3Client.PutObjectAsync(request);

        // Return the URL for the uploaded image
        // In production, this would be a CloudFront URL or pre-signed URL
        // For LocalStack, we construct the URL directly
        var serviceUrl = _s3Client.Config.ServiceURL ?? "http://localhost:4566";
        return $"{serviceUrl}/{BucketName}/{key}";
    }

    public bool IsValidImageType(string mimeType)
    {
        return AllowedMimeTypes.Contains(mimeType.ToLowerInvariant());
    }

    public bool IsValidImageSize(int sizeInBytes)
    {
        return sizeInBytes > 0 && sizeInBytes <= MaxImageSizeBytes;
    }

    private static string GetExtensionFromMimeType(string mimeType)
    {
        return mimeType.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            _ => ".bin"
        };
    }
}
