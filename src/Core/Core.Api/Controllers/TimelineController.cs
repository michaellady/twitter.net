using Core.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace Core.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimelineController : ControllerBase
{
    private readonly TimelineService _timelineService;

    public TimelineController(TimelineService timelineService)
    {
        _timelineService = timelineService;
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetTimeline(
        string userId,
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest("User ID is required");
        }

        if (limit < 1 || limit > 100)
        {
            limit = 20;
        }

        var response = await _timelineService.GetTimelineAsync(userId, cursor, limit);

        return Ok(new
        {
            tweets = response.Tweets,
            nextCursor = response.NextCursor
        });
    }
}
