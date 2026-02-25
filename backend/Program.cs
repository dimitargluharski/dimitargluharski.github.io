using MyGamesPortal.Backend.Hubs; // Увери се, че този namespace съществува
using MyGamesPortal.Backend.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --- Услуги ---
builder.Services.AddControllers();
builder.Services.AddSignalR(); // ЗАПАЗВАМЕ ГО
builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();

// --- CORS ---
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(frontendOrigin)
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