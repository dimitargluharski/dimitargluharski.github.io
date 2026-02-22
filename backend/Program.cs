using MyGamesPortal.Backend.Hubs;
using MyGamesPortal.Backend.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSignalR();
builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();
builder.Services.AddSingleton<ICodenamesService, InMemoryCodenamesService>();

var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(frontendOrigin)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");
app.MapControllers();
app.MapHub<LobbyHub>("/hub/lobby");

app.Run();
