# Local PostgreSQL Setup

This backend uses PostgreSQL through Entity Framework Core as its primary persistent store.

## Prerequisites

- PostgreSQL server running locally (or reachable)
- .NET 8 SDK

## Connection String

Update `DefaultConnection` in:

- `UniversityEventManagement.Api\appsettings.json`
- optionally `UniversityEventManagement.Api\appsettings.Development.json`

Example:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=UniversityEventManagementDb;Username=postgres;Password=POSTGRES_SIFRE"
}
```

If you use a different database name or credentials, replace the connection string accordingly.

## EF Core Commands

Run these from the repository root:

```powershell
dotnet ef migrations add <MigrationName> --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --startup-project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --output-dir Migrations
dotnet ef database update --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --startup-project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj
```

## Run The API

```powershell
dotnet run --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj
```

On startup the API applies pending migrations and seeds a minimal development dataset if the database is empty.
