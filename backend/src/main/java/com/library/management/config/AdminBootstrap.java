package com.library.management.config;

import com.library.management.user.LibraryUser;
import com.library.management.user.LibraryUserRepository;
import com.library.management.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {
    @Bean
    ApplicationRunner createConfiguredAdmin(LibraryUserRepository userRepository, PasswordEncoder passwordEncoder,
            @Value("${library.admin.username}") String username,
            @Value("${library.admin.password}") String password) {
        return args -> {
            if (username.isBlank() != password.isBlank()) {
                throw new IllegalStateException("Set both LIBRARY_ADMIN_USERNAME and LIBRARY_ADMIN_PASSWORD.");
            }
            if (!username.isBlank()) {
                if (password.length() < 12) {
                    throw new IllegalStateException("LIBRARY_ADMIN_PASSWORD must be at least 12 characters.");
                }
                LibraryUser existingUser = userRepository.findByUsernameIgnoreCase(username).orElse(null);
                if (existingUser == null) {
                    userRepository.save(new LibraryUser(username.trim(), passwordEncoder.encode(password), UserRole.ADMIN));
                } else if (existingUser.getRole() != UserRole.ADMIN) {
                    throw new IllegalStateException(
                            "The configured admin username already belongs to a non-admin account.");
                }
            }
        };
    }
}
