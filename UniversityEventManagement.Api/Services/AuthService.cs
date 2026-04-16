using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UniversityEventManagement.Api.Data;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Models;
using UniversityEventManagement.Api.Security;

namespace UniversityEventManagement.Api.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _dbContext;

    public AuthService(IConfiguration configuration, AppDbContext dbContext)
    {
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public ServiceResult<AuthResponse> Register(RegisterRequest request)
    {
        if (!UserRoles.IsSupported(request.Role))
        {
            return ServiceResult<AuthResponse>.BadRequest("Invalid role");
        }

        var normalizedEmail = request.Email.Trim();
        var existingUser = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(user => user.Email.ToLower() == normalizedEmail.ToLower());

        if (existingUser is not null)
        {
            return ServiceResult<AuthResponse>.Conflict("Email is already registered");
        }

        if (request.ClubId.HasValue && !_dbContext.Clubs.Any(club => club.Id == request.ClubId.Value))
        {
            return ServiceResult<AuthResponse>.NotFound("Club not found");
        }

        var createdUser = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = request.Password,
            Role = UserRoles.Normalize(request.Role),
            Department = request.Department.Trim(),
            Faculty = request.Faculty.Trim(),
            StudentNumber = request.StudentNumber.Trim(),
            YearClass = request.YearClass.Trim(),
            IsActiveMember = request.IsActiveMember,
            ClubId = request.ClubId
        };

        _dbContext.Users.Add(createdUser);
        _dbContext.SaveChanges();

        return ServiceResult<AuthResponse>.Ok(new AuthResponse
        {
            Token = string.Empty,
            UserId = createdUser.Id,
            Name = createdUser.FullName,
            FullName = createdUser.FullName,
            Role = createdUser.Role,
            ClubId = createdUser.ClubId,
            Message = "Registration successful"
        });
    }

    public ServiceResult<AuthResponse> Login(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim();
        var user = _dbContext.Users
            .AsNoTracking()
            .FirstOrDefault(existingUser =>
                existingUser.Email.ToLower() == normalizedEmail.ToLower() &&
                existingUser.PasswordHash == request.Password);

        if (user is null)
        {
            return ServiceResult<AuthResponse>.Unauthorized();
        }

        return ServiceResult<AuthResponse>.Ok(new AuthResponse
        {
            Token = GenerateToken(user),
            UserId = user.Id,
            Name = user.FullName,
            FullName = user.FullName,
            Role = user.Role,
            ClubId = user.ClubId,
            Message = "Login successful"
        });
    }

    private string GenerateToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT signing key is not configured.");
        var jwtIssuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("JWT issuer is not configured.");
        var jwtAudience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("JWT audience is not configured.");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.FullName),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
