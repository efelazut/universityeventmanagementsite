namespace UniversityEventManagement.Api.Security;

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string ClubManager = "ClubManager";
    public const string Student = "Student";

    public static readonly string[] All = [Admin, ClubManager, Student];

    public static bool IsSupported(string? role)
    {
        return !string.IsNullOrWhiteSpace(role) &&
               All.Contains(role, StringComparer.OrdinalIgnoreCase);
    }

    public static string Normalize(string role)
    {
        return All.First(supportedRole => supportedRole.Equals(role, StringComparison.OrdinalIgnoreCase));
    }
}
