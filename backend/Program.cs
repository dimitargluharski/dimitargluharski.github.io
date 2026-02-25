// using MyGamesPortal.Backend.Hubs;
// using MyGamesPortal.Backend.Services;
// using System.Text.Json.Serialization;

// var builder = WebApplication.CreateBuilder(args);

// // Add services
// builder.Services
//     .AddControllers()
//     .AddJsonOptions(options =>
//     {
//         options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
//     });
// builder.Services.AddSignalR();
// builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();
// builder.Services.AddSingleton<ICodenamesService, InMemoryCodenamesService>();

// var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowFrontend", policyBuilder =>
//     {
//         policyBuilder
//             .WithOrigins(frontendOrigin)
//             .AllowAnyMethod()
//             .AllowAnyHeader()
//             .AllowCredentials();
//     });
// });

// var app = builder.Build();

// app.UseCors("AllowFrontend");
// app.MapControllers();
// app.MapHub<LobbyHub>("/");

// app.Run();


using MyGamesPortal.Backend.Hubs;
using MyGamesPortal.Backend.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --- ТВОЯТА ЛОГИКА (БЕЗ ПРОМЯНА) ---
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddSignalR();
builder.Services.AddSingleton<IRoomService, InMemoryRoomService>();
builder.Services.AddSingleton<ICodenamesService, InMemoryCodenamesService>();

// --- ДОБАВЯМЕ SWAGGER (За да тестваш API-то директно) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- КРИТИЧНО: Настройка на CORS ---
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(frontendOrigin) // Тук ще дойде твоят GitHub Pages URL
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Задължително за SignalR!
    });
});

var app = builder.Build();

// --- ДОБАВЯМЕ ВИЗУАЛНО ПОТВЪРЖДЕНИЕ ---
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
    c.RoutePrefix = "swagger"; 
});

// Тази точка спира 404 грешката и ти казва, че сървърът е ОК
app.MapGet("/health", () => Results.Content("<h1>Backend is Running Successfully!</h1>", "text/html"));

// --- ПРИЛАГАНЕ НА ТВОИТЕ МАРШРУТИ ---
app.UseCors("AllowFrontend");
app.MapControllers();
app.MapHub<LobbyHub>("/");

app.Run();