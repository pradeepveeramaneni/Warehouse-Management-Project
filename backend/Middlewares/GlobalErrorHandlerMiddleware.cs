using System.Net;
using System.Text.Json;
using Backend.Common;
using Backend.Exceptions;

namespace Backend.Middlewares;

public class GlobalErrorHandlerMiddleware : IMiddleware
{
    private readonly ILogger<GlobalErrorHandlerMiddleware> _logger;

    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public GlobalErrorHandlerMiddleware(ILogger<GlobalErrorHandlerMiddleware> logger)
    {
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (InvalidCredentialException e)
        {
            await HandleException(context, HttpStatusCode.Unauthorized, e);
        }
        catch (EntityAlreadyExistsException e)
        {
            await HandleException(context, HttpStatusCode.Conflict, e);
        }
        catch (EntityNotFoundException e)
        {
            await HandleException(context, HttpStatusCode.NotFound, e);
        }
        catch (Exception e)
        {
            await HandleException(context, HttpStatusCode.InternalServerError, e);
        }
    }

    private async Task HandleException(HttpContext context, HttpStatusCode statusCode, Exception e)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        _logger.LogError(e, "An error occurred: {ErrorMessage}", e.Message);
        var response = new ServiceResponse<object>
        {
            Success = false,
            Message = e.Message
        };

        var json = JsonSerializer.Serialize(response, _serializerOptions);
        await context.Response.WriteAsync(json);
    }
}