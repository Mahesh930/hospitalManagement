package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.LoginRequestDto;
import com.mahesh.hospitalManagement.dto.LoginResponseDto;
import com.mahesh.hospitalManagement.dto.SignUpRequestDto;
import com.mahesh.hospitalManagement.dto.SignupResponseDto;
import com.mahesh.hospitalManagement.security.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller responsible for handling user authentication and registration workflows.
 * 
 * Logic & Security Overview:
 * 1. Public Access: These endpoints (/auth/login, /auth/signup) are publicly accessible without JWT credentials.
 * 2. Login Flow: Validates user credentials, generates a signed JWT token containing user identity and roles, and logs auth metrics.
 * 3. Signup Flow: Creates new user profiles, hashes passwords securely using BCrypt, assigns default roles, and initializes tenant context.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    /**
     * Authenticates user credentials (username/email and password) and issues a JWT token.
     * 
     * Logic Flow:
     * - Receives credentials in LoginRequestDto.
     * - Delegates authentication to AuthService where credentials are verified against stored BCrypt hashes.
     * - Returns a LoginResponseDto containing the signed JWT bearer token, user ID, and associated role permissions.
     *
     * @param loginRequestDto Request payload containing username and raw password.
     * @return ResponseEntity holding LoginResponseDto with access token and user identity.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        // Delegate credential validation and JWT token generation to the security service layer
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    /**
     * Registers a new user account within the system.
     * 
     * Logic Flow:
     * - Validates that the requested username/email does not already exist in the database.
     * - Encrypts the user's password using BCrypt hashing before persistence.
     * - Persists the new User entity and returns account metadata.
     *
     * @param signupRequestDto Request payload with full name, username, email, and password.
     * @return ResponseEntity holding SignupResponseDto with created user profile details.
     */
    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@RequestBody SignUpRequestDto signupRequestDto) {
        // Delegate user account creation and password hashing to the security service layer
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }

}
