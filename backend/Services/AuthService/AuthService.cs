using Backend.Common;
using Backend.Data;
using Backend.DTOs.User;
using Backend.Enums;
using Backend.Exceptions;
using Backend.Services.PasswordService;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.AuthService;

public class AuthService : IAuthService
{
    private readonly DataContext _context;
    private readonly ILogger<AuthService> _logger;
    private readonly IPasswordService _passwordService;

    public AuthService(IPasswordService passwordService, ILogger<AuthService> logger, DataContext context
    )
    {
        _passwordService = passwordService;
        _logger = logger;
        _context = context;
    }

    public async Task<ServiceResponse<Guid>> Login(LoginUserDto loginUser)
    {
        var response = new ServiceResponse<Guid>();

        var user = await _context.User.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == loginUser.Email.ToLower() && u.Role == loginUser.Role);

        if (user is null)
            throw new EntityNotFoundException(EntityType.User);

        var isPasswordValid = _passwordService.VerifyPassword(loginUser.Password, user.Password);

        if (!isPasswordValid)
            throw new InvalidCredentialException();

        response.Data = user.Id;
        response.Message = "User verified successfully.";
        return response;
    }
}