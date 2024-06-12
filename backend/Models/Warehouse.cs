using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[NotMapped]
public class Warehouse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Product> Products { get; set; }
}