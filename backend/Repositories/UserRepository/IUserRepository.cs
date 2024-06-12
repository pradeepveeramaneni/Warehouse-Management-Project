using Backend.Models;

namespace Backend.Repositories.UserRepository;

public interface IUserRepository
{
    Task<User?> GetUserById(Guid id);
    Task<List<User>> GetUsers();
    Task<User> CreateUser(User user);
    Task<User> UpdateUser(User user);
    Task<Guid> ToggleUserStatus(User user);
    Task<bool> UserExists(Guid id);
    Task<bool> UserExists(string email);
}