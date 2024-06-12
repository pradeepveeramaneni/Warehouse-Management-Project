using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

[Table("user")]
[Index(nameof(Email), IsUnique = true)]
public class User : BaseEntity
{
    [Required(ErrorMessage = "Name field is required")]
    [StringLength(100, ErrorMessage = "Name field must be between 3 and 100 characters", MinimumLength = 3)]
    [Display(Name = "Name")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email field is required")]
    [EmailAddress(ErrorMessage = "Email field is not valid")]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password field is required")]
    [DataType(DataType.Password)]
    [StringLength(100, ErrorMessage = "Password field must be between 6 and 100 characters", MinimumLength = 6)]
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role field is required")]
    [Display(Name = "Role")]
    public UserRole Role { get; set; }

    [Required(ErrorMessage = "IsActive field is required")]
    [Display(Name = "IsActive")]
    public bool IsActive { get; set; } = true;

    [NotMapped] public string otp { get; set; }
}