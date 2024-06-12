using Backend.Common;
using Backend.DTOs.User;
using Backend.Models;
using Backend.Services.UserService;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : Controller
{
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _userService;

    public UserController(IUserService userService,
        ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("GetAll")]
    public async Task<ActionResult<ServiceResponse<List<User>>>> GetUsers()
    {
        return Ok(await _userService.GetUsers());
    }


    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceResponse<GetUserDto>>> GetUser(Guid id)
    {
        return Ok(await _userService.GetUserById(id));
    }

    [HttpPost]
    public async Task<ActionResult<ServiceResponse<GetUserDto>>> CreateUser(CreateUserDto user)
    {
        return Ok(await _userService.CreateUser(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ServiceResponse<GetUserDto>>> UpdateUser(Guid id, UpdateUserDto updateUser)
    {
        return Ok(await _userService.UpdateUser(id, updateUser));
    }

    [HttpPut("ToggleUserStatus/{id:guid}")]
    public async Task<ActionResult<ServiceResponse<bool>>> ToggleUserStatus(Guid id)
    {
        return Ok(await _userService.ToggleUserStatus(id));
    }
}