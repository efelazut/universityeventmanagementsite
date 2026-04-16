using Microsoft.AspNetCore.Mvc;

namespace UniversityEventManagement.Api.Security;

public static class RoleRequestAuthorization
{
    private const string RoleHeaderName = "X-User-Role";

    public static IActionResult? RequireAnyRole(ControllerBase controller, params string[] allowedRoles)
    {
        if (!controller.Request.Headers.TryGetValue(RoleHeaderName, out var roleHeaderValues))
        {
            return controller.Unauthorized();
        }

        var requestedRole = roleHeaderValues.ToString();
        if (string.IsNullOrWhiteSpace(requestedRole))
        {
            return controller.Unauthorized();
        }

        var isAllowed = allowedRoles.Any(allowedRole =>
            allowedRole.Equals(requestedRole, StringComparison.OrdinalIgnoreCase));

        return isAllowed ? null : controller.Forbid();
    }
}
