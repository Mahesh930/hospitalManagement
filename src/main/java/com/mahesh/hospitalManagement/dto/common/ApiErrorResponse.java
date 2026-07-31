package com.mahesh.hospitalManagement.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {
    private boolean success;
    private ErrorDetails error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDetails {
        private int code;
        private String message;
        private Map<String, Object> details;
    }

    public static ApiErrorResponse of(int code, String message, Map<String, Object> details) {
        return ApiErrorResponse.builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .build();
    }

    public static ApiErrorResponse of(int code, String message) {
        return of(code, message, null);
    }
}
