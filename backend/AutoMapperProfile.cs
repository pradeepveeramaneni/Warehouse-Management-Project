using AutoMapper;
using Backend.DTOs.User;
using Backend.Models;

namespace Backend;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // User
        CreateMap<User, BaseUserDto>();
        CreateMap<User, GetUserDto>();
        CreateMap<User, LoginUserDto>();
        CreateMap<User, UpdateUserDto>();
        CreateMap<User, CreateUserDto>();
    }
}