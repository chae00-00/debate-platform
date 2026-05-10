package com.phoenix.debate_service.global.exception;

import org.springframework.http.HttpStatusCode;

public class FastApiClientException extends RuntimeException {

    private final HttpStatusCode statusCode;
    private final String responseBody;

    public FastApiClientException(HttpStatusCode statusCode, String message, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public HttpStatusCode getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }

    public static FastApiClientException fromResponse(HttpStatusCode statusCode, String message, String responseBody) {
        String detailedMessage = message;
        if (responseBody != null && !responseBody.isBlank()) {
            detailedMessage = message + " " + responseBody;
        }
        return new FastApiClientException(statusCode, detailedMessage, responseBody);
    }
}
