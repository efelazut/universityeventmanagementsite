# Local SQL Server Setup

This backend now uses SQL Server through Entity Framework Core as its primary persistent store.

## Prerequisites

- SQL Server LocalDB, SQL Server Express, or another reachable SQL Server instance
- .NET 8 SDK

## Connection String

Update `DefaultConnection` in:

- `C:\Users\Efe\Documents\New project\UniversityEventManagement.Api\appsettings.json`
- optionally `C:\Users\Efe\Documents\New project\UniversityEventManagement.Api\appsettings.Development.json`

Example:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=UniversityEventManagementDb;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=True;"
}
```

If you use SQL authentication instead of Windows authentication, replace the connection string accordingly.

## EF Core Commands

Run these from `C:\Users\Efe\Documents\New project`:

```powershell
dotnet ef migrations add <MigrationName> --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --startup-project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --output-dir Migrations
dotnet ef database update --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj --startup-project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj
```

## Run The API

```powershell
dotnet run --project .\UniversityEventManagement.Api\UniversityEventManagement.Api.csproj
```

On startup the API applies pending migrations and seeds a minimal development dataset if the database is empty.
