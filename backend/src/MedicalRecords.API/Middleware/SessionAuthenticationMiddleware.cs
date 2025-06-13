using MedicalRecords.Application.Services;

namespace MedicalRecords.API.Middleware;

public class SessionAuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public SessionAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AuthService authService)
    {
        var sessionToken = context.Request.Cookies["session_token"];

        if (!string.IsNullOrEmpty(sessionToken))
        {
            var user = await authService.GetCurrentUserAsync(sessionToken);
            if (user != null)
            {
                context.Items["CurrentUser"] = user;
                context.Items["UserId"] = user.Id;
            }
        }

        await _next(context);
    }
}