using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class DataContext : DbContext
{
    private readonly ILogger<DataContext> _logger;

    public DataContext(DbContextOptions<DataContext> options, ILogger<DataContext> logger) : base(options)
    {
        _logger = logger;
    }

    public virtual DbSet<User> User { get; set; }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is BaseEntity && (
                e.State == EntityState.Added
                || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            ((BaseEntity)entityEntry.Entity).UpdatedAt = DateTime.UtcNow;

            if (entityEntry.State == EntityState.Added)
                ((BaseEntity)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e => e.Entity is BaseEntity && (
                e.State == EntityState.Added
                || e.State == EntityState.Modified));

        foreach (var entityEntry in entries)
        {
            ((BaseEntity)entityEntry.Entity).UpdatedAt = DateTime.UtcNow;

            if (entityEntry.State == EntityState.Added)
                ((BaseEntity)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
        }

        return base.SaveChanges();
    }


}