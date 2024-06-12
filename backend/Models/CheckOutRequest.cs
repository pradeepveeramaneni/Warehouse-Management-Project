using System.ComponentModel.DataAnnotations.Schema;
using Backend.Enums;

namespace Backend.Models;

[NotMapped]
public class CheckOutRequest
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public CheckOutStatus Status { get; set; }
    public int Quantity { get; set; }

    public string TrackingId { get; set; }
    public string CustomerName { get; set; }
    public string CustomerPhone { get; set; }
    public string CustomerAddress1 { get; set; }
    public string CustomerAddress2 { get; set; }
    public string CustomerCity { get; set; }
    public string CustomerState { get; set; }
    public string CustomerZip { get; set; }

    public Guid ProductId { get; set; }
    public Product Product { get; set; }

    public Guid userId { get; set; }
    public User User { get; set; }
}