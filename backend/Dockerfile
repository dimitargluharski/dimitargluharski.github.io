FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore "backend/MyGamesPortal.Backend.csproj"
RUN dotnet publish "backend/MyGamesPortal.Backend.csproj" -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .

ENTRYPOINT ["dotnet", "MyGamesPortal.Backend.dll"]