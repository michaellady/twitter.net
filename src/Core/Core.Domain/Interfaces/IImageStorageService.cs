namespace Core.Domain.Interfaces;

public interface IImageStorageService
{
    Task<string> UploadImageAsync(byte[] imageData, string tweetId, string mimeType);
    bool IsValidImageType(string mimeType);
    bool IsValidImageSize(int sizeInBytes);
}
