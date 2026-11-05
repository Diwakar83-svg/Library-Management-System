package com.library.management.user;

public record AuthResponse(Long userId, String username, UserRole role) {
    public static AuthResponse from(LibraryUser user) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
