using MyGamesPortal.Backend.Hubs; // Увери се, че този namespace съществува
using MyGamesPortal.Backend.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --- Услуги ---
builder.Services.AddControllers();
builder.Services.AddSignalR(); // ЗАПАЗВАМЕ ГО
builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();
builder.Services.AddSingleton<ICodenamesService, InMemoryCodenamesService>();

// --- CORS ---
var configuredOrigins = builder.Configuration.GetSection("FrontendOrigins").Get<string[]>();
var frontendOrigins = configuredOrigins is { Length: > 0 }
    ? configuredOrigins
    : [
        builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173",
        "https://dimitargluharski.github.io"
    ];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(frontendOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // ЗАДЪЛЖИТЕЛНО за SignalR
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// --- МАРШРУТИ (Провери ги внимателно!) ---
app.MapGet("/", () => "Backend is Live with SignalR!");

app.MapHub<LobbyHub>("/hub/lobby");

app.MapControllers();

app.Run();