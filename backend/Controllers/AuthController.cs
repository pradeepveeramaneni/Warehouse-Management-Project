using Backend.Common;
using Backend.DTOs.User;
using Backend.Services.AuthService;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : Controller
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger, IAuthService authService)
    {
        _logger = logger;
        _authService = authService;
    }

    [HttpPost("Login")]
    public async Task<ActionResult<ServiceResponse<string>>> Login(LoginUserDto loginUser)
    {
        return Ok(await _authService.Login(loginUser));
    }
}