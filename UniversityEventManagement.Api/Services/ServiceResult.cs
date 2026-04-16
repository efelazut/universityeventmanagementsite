namespace UniversityEventManagement.Api.Services;

public class ServiceResult
{
    public ServiceResultStatus Status { get; init; }
    public string? Message { get; init; }

    public static ServiceResult Ok() => new() { Status = ServiceResultStatus.Ok };
    public static ServiceResult BadRequest(string? message = null) => new() { Status = ServiceResultStatus.BadRequest, Message = message };
    public static ServiceResult NotFound(string? message = null) => new() { Status = ServiceResultStatus.NotFound, Message = message };
    public static ServiceResult Conflict(string? message = null) => new() { Status = ServiceResultStatus.Conflict, Message = message };
    public static ServiceResult Unauthorized(string? message = null) => new() { Status = ServiceResultStatus.Unauthorized, Message = message };
    public static ServiceResult Forbidden(string? message = null) => new() { Status = ServiceResultStatus.Forbidden, Message = message };
}

public class ServiceResult<T> : ServiceResult
{
    public T? Data { get; init; }

    public static ServiceResult<T> Ok(T data) => new() { Status = ServiceResultStatus.Ok, Data = data };
    public static ServiceResult<T> Created(T data) => new() { Status = ServiceResultStatus.Created, Data = data };
    public static new ServiceResult<T> BadRequest(string? message = null) => new() { Status = ServiceResultStatus.BadRequest, Message = message };
    public static new ServiceResult<T> NotFound(string? message = null) => new() { Status = ServiceResultStatus.NotFound, Message = message };
    public static new ServiceResult<T> Conflict(string? message = null) => new() { Status = ServiceResultStatus.Conflict, Message = message };
    public static new ServiceResult<T> Unauthorized(string? message = null) => new() { Status = ServiceResultStatus.Unauthorized, Message = message };
    public static new ServiceResult<T> Forbidden(string? message = null) => new() { Status = ServiceResultStatus.Forbidden, Message = message };
}
