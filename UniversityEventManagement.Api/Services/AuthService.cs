using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
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
    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthService(IConfiguration configuration, AppDbContext dbContext)
    {
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public ServiceResult<AuthResponse> Register(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedStudentNumber = request.StudentNumber.Trim();
        var fullName = request.FullName.Trim();

        if (string.IsNullOrWhiteSpace(fullName))
        {
            return ServiceResult<AuthResponse>.BadRequest("Ad soyad zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(normalizedStudentNumber))
        {
            return ServiceResult<AuthResponse>.BadRequest("Öğrenci numarası zorunludur.");
        }

        if (!IsAsciiEmail(normalizedEmail))
        {
            return ServiceResult<AuthResponse>.BadRequest("Geçerli ve Türkçe karakter içermeyen bir e-posta girin.");
        }

        if (request.Password.Length < 6)
        {
            return ServiceResult<AuthResponse>.BadRequest("Şifre en az 6 karakter olmalıdır.");
        }

        if (request.Password != request.ConfirmPassword)
        {
            return ServiceResult<AuthResponse>.BadRequest("Şifreler eşleşmiyor.");
        }

        if (_dbContext.Users.AsNoTracking().Any(user => user.Email.ToLower() == normalizedEmail))
        {
            return ServiceResult<AuthResponse>.Conflict("Bu e-posta zaten kullanılıyor.");
        }

        if (_dbContext.Users.AsNoTracking().Any(user => user.StudentNumber.ToLower() == normalizedStudentNumber.ToLower()))
        {
            return ServiceResult<AuthResponse>.Conflict("Bu öğrenci numarası kayıtlı.");
        }

        var createdUser = new User
        {
            FullName = fullName,
            Email = normalizedEmail,
            Role = UserRoles.Student,
            Department = "Belirtilmedi",
            Faculty = "Belirtilmedi",
            StudentNumber = normalizedStudentNumber,
            YearClass = "Belirtilmedi",
            IsActiveMember = true
        };

        createdUser.PasswordHash = _passwordHasher.HashPassword(createdUser, request.Password);

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
            Message = "Kayıt başarılı, giriş yapabilirsiniz."
        });
    }

    public ServiceResult<AuthResponse> Login(LoginRequest request)
    {
        var identifier = (string.IsNullOrWhiteSpace(request.EmailOrStudentNumber) ? request.Email : request.EmailOrStudentNumber).Trim();
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return ServiceResult<AuthResponse>.BadRequest("E-posta veya öğrenci numarası girin.");
        }

        var isEmail = identifier.Contains('@');
        var normalizedIdentifier = isEmail ? identifier.ToLowerInvariant() : identifier;
        var user = _dbContext.Users
            .Include(existingUser => existingUser.ManagedClubs)
                .ThenInclude(manager => manager.Club)
            .FirstOrDefault(existingUser => isEmail
                ? existingUser.Email.ToLower() == normalizedIdentifier
                : existingUser.StudentNumber.ToLower() == normalizedIdentifier.ToLower());

        if (user is null || !VerifyPassword(user, request.Password, out var shouldRehash))
        {
            return ServiceResult<AuthResponse>.Unauthorized();
        }

        if (shouldRehash)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            _dbContext.SaveChanges();
        }

        return ServiceResult<AuthResponse>.Ok(new AuthResponse
        {
            Token = GenerateToken(user),
            UserId = user.Id,
            Name = user.FullName,
            FullName = user.FullName,
            Role = user.Role,
            ClubId = user.ClubId ?? user.ManagedClubs.OrderBy(manager => manager.Role == "President" ? 0 : 1).Select(manager => (int?)manager.ClubId).FirstOrDefault(),
            ManagedClubs = MapManagedClubs(user),
            Message = "Login successful"
        });
    }

    private bool VerifyPassword(User user, string password, out bool shouldRehash)
    {
        shouldRehash = false;

        try
        {
            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                shouldRehash = true;
                return true;
            }

            if (result == PasswordVerificationResult.Success)
            {
                return true;
            }
        }
        catch (FormatException)
        {
            // Legacy demo data used plain text passwords; migrate after successful login.
        }

        var matchesLegacyPlainText = user.PasswordHash == password;
        shouldRehash = matchesLegacyPlainText;
        return matchesLegacyPlainText;
    }

    private static bool IsAsciiEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !Regex.IsMatch(email, "^[\\u0000-\\u007F]+$"))
        {
            return false;
        }

        try
        {
            var address = new MailAddress(email);
            return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static IReadOnlyList<ManagedClubSummaryResponse> MapManagedClubs(User user) => user.ManagedClubs
        .Where(manager => manager.Club is not null)
        .OrderBy(manager => manager.Role == "President" ? 0 : 1)
        .ThenBy(manager => manager.Club!.Name)
        .Select(manager => new ManagedClubSummaryResponse
        {
            ClubId = manager.ClubId,
            ClubName = manager.Club!.Name,
            Role = manager.Role
        })
        .ToList();

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
