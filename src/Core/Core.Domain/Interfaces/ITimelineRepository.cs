using Core.Domain.Entities;

namespace Core.Domain.Interfaces;

public class TimelineQueryResult
{
    public IEnumerable<TimelineEntry> Entries { get; set; } = Enumerable.Empty<TimelineEntry>();
    public string? NextCursor { get; set; }
}

public interface ITimelineRepository
{
    Task AddEntryAsync(TimelineEntry entry);
    Task AddEntriesAsync(IEnumerable<TimelineEntry> entries);
    Task<TimelineQueryResult> GetTimelineAsync(string userId, string? cursor = null, int limit = 20);
}
