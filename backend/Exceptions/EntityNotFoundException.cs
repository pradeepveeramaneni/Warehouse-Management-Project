using Backend.Enums;

namespace Backend.Exceptions;

public class EntityNotFoundException : Exception
{
    public EntityNotFoundException(EntityType entityType, string entityId)
        : base($"The {entityType.ToString()} with id {entityId} was not found.")
    {
    }

    public EntityNotFoundException(EntityType entityType)
        : base($"{entityType.ToString()} not found.")
    {
    }

    public EntityNotFoundException(string message) : base(message)
    {
    }
}