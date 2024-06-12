using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories.UserRepository;

public class UserRepository : IUserRepository
{
    private readonly DataContext _context;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(DataContext context, ILogger<UserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> UserExists(Guid id)
    {
        return await _context.User.AnyAsync(u => u.Id == id);
    }

    public async Task<bool> UserExists(string email)
    {
        return await _context.User.AnyAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<List<User>> GetUsers()
    {
        return await _context.User.ToListAsync();
    }

    public async Task<User?> GetUserById(Guid id)
    {
        return await _context.User.FindAsync(id);
    }

    public async Task<Guid> ToggleUserStatus(User user)
    {
        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        return user.Id;
    }

    public async Task<User> CreateUser(User user)
    {
        user.Id = Guid.NewGuid();
        _context.User.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateUser(User user)
    {
        _context.User.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }
}