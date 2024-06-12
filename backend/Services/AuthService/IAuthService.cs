using Backend.Common;
using Backend.DTOs.User;

namespace Backend.Services.AuthService;

public interface IAuthService
{
    Task<ServiceResponse<Guid>> Login(LoginUserDto loginUser);
}