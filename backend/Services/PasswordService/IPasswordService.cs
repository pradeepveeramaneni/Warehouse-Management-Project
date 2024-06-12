namespace Backend.Services.PasswordService;

public interface IPasswordService
{
    bool VerifyPassword(string password, string hashedPassword);
    string HashPassword(string password);
}