namespace Backend.Exceptions;

public class InvalidCredentialException : Exception
{
    public InvalidCredentialException()
        : base("Invalid credentials.")
    {
    }

    public InvalidCredentialException(string message) : base(message)
    {
    }
}