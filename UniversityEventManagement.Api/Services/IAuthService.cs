using UniversityEventManagement.Api.DTOs;

namespace UniversityEventManagement.Api.Services;

public interface IAuthService
{
    ServiceResult<AuthResponse> Register(RegisterRequest request);
    ServiceResult<AuthResponse> Login(LoginRequest request);
}
