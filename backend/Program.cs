using MyGamesPortal.Backend.Hubs;
using MyGamesPortal.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();

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
