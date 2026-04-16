using Microsoft.AspNetCore.Mvc;
using UniversityEventManagement.Api.DTOs;
using UniversityEventManagement.Api.Services;

namespace UniversityEventManagement.Api.Controllers;

public static class ControllerResultExtensions
{
    public static ActionResult ToActionResult<T>(
        this ControllerBase controller,
        ServiceResult<T> result,
        string? createdAtAction = null) where T : class
    {
        return result.Status switch
        {
            ServiceResultStatus.Ok => controller.Ok(result.Data),
            ServiceResultStatus.Created when createdAtAction is not null && result.Data is IEntityResponse entity =>
                controller.CreatedAtAction(createdAtAction, new { id = entity.Id }, result.Data),
            ServiceResultStatus.Created => controller.Ok(result.Data),
            ServiceResultStatus.BadRequest => controller.BadRequest(result.Message),
            ServiceResultStatus.NotFound => controller.NotFound(result.Message),
            ServiceResultStatus.Conflict => controller.Conflict(result.Message),
            ServiceResultStatus.Unauthorized => controller.Unauthorized(result.Message),
            ServiceResultStatus.Forbidden => controller.Forbid(),
            _ => controller.StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    public static ActionResult ToActionResult(this ControllerBase controller, ServiceResult result)
    {
        return result.Status switch
        {
            ServiceResultStatus.Ok => controller.Ok(),
            ServiceResultStatus.BadRequest => controller.BadRequest(result.Message),
            ServiceResultStatus.NotFound => controller.NotFound(result.Message),
            ServiceResultStatus.Conflict => controller.Conflict(result.Message),
            ServiceResultStatus.Unauthorized => controller.Unauthorized(result.Message),
            ServiceResultStatus.Forbidden => controller.Forbid(),
            _ => controller.StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
