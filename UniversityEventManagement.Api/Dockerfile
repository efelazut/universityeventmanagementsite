FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["UniversityEventManagement.Api.csproj", "./"]
RUN dotnet restore "UniversityEventManagement.Api.csproj"

COPY . .
RUN dotnet publish "UniversityEventManagement.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "UniversityEventManagement.Api.dll"]
