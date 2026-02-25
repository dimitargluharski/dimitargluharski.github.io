# Използваме SDK на .NET 10 за компилация
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

# Използваме Runtime на .NET 10 за стартиране
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# Увери се, че името тук съвпада точно с твоя .csproj файл
ENTRYPOINT ["dotnet", "backend.dll"]