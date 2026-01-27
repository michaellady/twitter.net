var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Register services - ITweetRepository will be registered by tests or production config
// This allows the integration tests to inject their own implementation

var app = builder.Build();

app.MapControllers();

app.Run();

// Make the implicit Program class public so test projects can access it
public partial class Program { }
