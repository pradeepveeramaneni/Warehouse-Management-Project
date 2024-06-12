// Initializing these fields to some default value may not be the best idea
// in this case because it can mask potential bugs in your code.
// And making them nullable would contradict with your [Required] data annotation.
// So, we are using #nullable disable and #nullable restore to disable nullable warnings

#nullable disable
using Backend.Enums;

namespace Backend.DTOs.User;

public class BaseUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
}

#nullable restore