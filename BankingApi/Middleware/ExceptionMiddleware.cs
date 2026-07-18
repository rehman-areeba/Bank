using FluentValidation;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace BankingApi.Middleware;

public class ExceptionMiddleware(
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Unhandled {ExceptionType} on {Method} {Path}: {Message}",
                ex.GetType().Name,
                context.Request.Method,
                context.Request.Path,
                ex.Message);

            await WriteResponseAsync(context, ex);
        }
    }

    private Task WriteResponseAsync(HttpContext context, Exception exception)
    {
        var (status, message, errors) = Classify(exception);

        var body = new ApiErrorResponse(
            message,
            errors,
            env.IsProduction() ? null : exception.ToString());

        context.Response.ContentType = "application/json";
        context.Response.StatusCode  = (int)status;

        if (context.Items["CorrelationId"] is string cid)
            context.Response.Headers["X-Correlation-ID"] = cid;

        return context.Response.WriteAsJsonAsync(body);
    }

    private static (HttpStatusCode status, string message, string[] errors) Classify(Exception ex) =>
        ex switch
        {
            ValidationException ve => (
                HttpStatusCode.UnprocessableEntity,
                "Validation failed",
                ve.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}").ToArray()),

            NotFoundException nfe => (
                HttpStatusCode.NotFound,
                nfe.Message,
                []),

            UnauthorizedAccessException ue => (
                HttpStatusCode.Unauthorized,
                ue.Message,
                []),

            InvalidOperationException ioe => (
                HttpStatusCode.BadRequest,
                ioe.Message,
                []),

            DbUpdateException due => (
                HttpStatusCode.Conflict,
                "A database conflict occurred. The operation could not be completed.",
                [due.InnerException?.Message ?? due.Message]),

            SqlException => (
                HttpStatusCode.ServiceUnavailable,
                "A database error occurred. Please try again later.",
                []),

            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred.",
                [])
        };
}

public record ApiErrorResponse(
    string Message,
    string[] Errors,
    string? Detail = null)
{
    public bool Success => false;
}

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}
