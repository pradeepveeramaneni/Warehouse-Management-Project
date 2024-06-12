using System.ComponentModel.DataAnnotations.Schema;
using Backend.Enums;

namespace Backend.Models;

[NotMapped]
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string UPC { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ProductStatus Status { get; set; }
    public string Memo { get; set; }
    public Condition Condition { get; set; }
    public bool Return { get; set; }
    public DateTime CheckedInTime { get; set; }

    public ICollection<CheckOutRequest> CheckOutRequests { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; }
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; }
}