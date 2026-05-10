package com.phoenix.debate_service.global.exception;

import java.time.Instant;

public record ApiErrorResponse(
        int status,
        String message,
        String path,
        Instant timestamp
) {
}
