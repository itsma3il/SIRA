"""Structured exception handlers for consistent API error responses."""
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers."""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic validation errors with detailed field-level messages."""
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"],
            })
        
        logger.warning(
            f"Validation error on {request.method} {request.url.path}: {errors}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation Error",
                "message": "Invalid input data",
                "details": errors,
            },
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        """Handle Pydantic validation errors."""
        errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"],
            })
        
        logger.warning(
            f"Pydantic validation error on {request.method} {request.url.path}: {errors}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation Error",
                "message": "Invalid data format",
                "details": errors,
            },
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        request: Request, exc: IntegrityError
    ) -> JSONResponse:
        """Handle database integrity errors (unique constraints, foreign keys)."""
        error_msg = str(exc.orig) if exc.orig else str(exc)
        
        # Try to extract meaningful error messages
        if "unique constraint" in error_msg.lower():
            message = "A record with this information already exists"
        elif "foreign key" in error_msg.lower():
            message = "Referenced resource does not exist"
        else:
            message = "Database integrity error"
        
        logger.error(
            f"Database integrity error on {request.method} {request.url.path}: {error_msg}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": "Integrity Error",
                "message": message,
                "details": error_msg if logger.level == logging.DEBUG else None,
            },
        )

    @app.exception_handler(OperationalError)
    async def operational_error_handler(
        request: Request, exc: OperationalError
    ) -> JSONResponse:
        """Handle database operational errors (connection issues, timeouts)."""
        error_msg = str(exc.orig) if exc.orig else str(exc)
        
        logger.error(
            f"Database operational error on {request.method} {request.url.path}: {error_msg}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service Unavailable",
                "message": "Database connection error. Please try again later.",
                "details": None,  # Don't expose internal errors
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Catch-all handler for unexpected exceptions."""
        logger.exception(
            f"Unexpected error on {request.method} {request.url.path}: {str(exc)}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred. Please try again later.",
                "details": str(exc) if logger.level == logging.DEBUG else None,
            },
        )
