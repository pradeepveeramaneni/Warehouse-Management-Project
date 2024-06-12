using Backend.Enums;

namespace Backend.Exceptions;

public class EntityAlreadyExistsException : Exception
{
    public EntityAlreadyExistsException(EntityType entityType, string entityId)
        : base($"The {entityType.ToString()} with id {entityId} already exists.")
    {
    }

    public EntityAlreadyExistsException(EntityType entityType)
        : base($"{entityType.ToString()} already exists.")
    {
    }

    public EntityAlreadyExistsException(string message) : base(message)
    {
    }
}