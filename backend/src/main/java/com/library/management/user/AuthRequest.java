package com.library.management.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Size(min = 8, max = 100) String password
) {
}
