using Backend.Enums;
using Backend.Models;
using Backend.Services.PasswordService;

namespace Backend.Data;

public class DataInitializer
{
    private readonly IPasswordService _passwordService;

    public DataInitializer(IPasswordService passwordService)
    {
        _passwordService = passwordService;
    }

    public void Initialize(DataContext context)
    {
        context.Database.EnsureCreated();

        // Seed data (if empty)
        InitializeUsers(context);
    }

    private void InitializeUsers(DataContext context)
    {
        if (context.User.Any()) return;

        var hashedPassword = _passwordService.HashPassword("password");

        context.User.AddRange(new List<User>
        {
            new()
            {
                Id = new Guid("00000000-0000-0000-0000-000000000003"),
                Name = "Employee",
                Email = "pradeepraov26@gmail.com",
                Password = hashedPassword,
                Role = UserRole.Employee,
                IsActive = true
            },
            new()
            {
                Id = new Guid("00000000-0000-0000-0000-000000000004"),
                Name = "Customer",
                Email = "Pradeepraoveeramaneni@gmail.com",
                Password = hashedPassword,
                Role = UserRole.Customer,
                IsActive = true
            }
        });

        context.SaveChanges();
    }
}