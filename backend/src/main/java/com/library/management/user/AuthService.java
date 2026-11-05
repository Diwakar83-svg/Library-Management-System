package com.library.management.user;

import java.util.Locale;

import com.library.management.common.ConflictException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final LibraryUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(LibraryUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse registerLibrarian(AuthRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("This username is already registered.");
        }
        LibraryUser user = userRepository.save(
                new LibraryUser(username, passwordEncoder.encode(request.password()), UserRole.LIBRARIAN));
        return AuthResponse.from(user);
    }
}
