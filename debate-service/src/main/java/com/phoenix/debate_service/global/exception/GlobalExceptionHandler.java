package com.phoenix.debate_service.global.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FastApiClientException.class)
    public ResponseEntity<ApiErrorResponse> handleFastApiClientException(
            FastApiClientException e,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = e.getStatusCode();
        ApiErrorResponse body = new ApiErrorResponse(
                statusCode.value(),
                e.getMessage(),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.status(statusCode).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException e,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                e.getMessage(),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(InvalidPhaseException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidPhaseException(
            InvalidPhaseException e,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                e.getMessage(),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
            ResponseStatusException e,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = e.getStatusCode();
        ApiErrorResponse body = new ApiErrorResponse(
                statusCode.value(),
                e.getReason() != null ? e.getReason() : e.getMessage(),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.status(statusCode).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorResponse> handleRuntimeException(
            RuntimeException e,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                e.getMessage(),
                request.getRequestURI(),
                Instant.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
