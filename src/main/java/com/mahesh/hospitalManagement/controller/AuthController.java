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

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    /**
     * Endpoint for user login.
     * @param loginRequestDto Request body with username and password.
     * @return ResponseEntity with JWT token and login status.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    /**
     * Endpoint for user registration.
     * @param signupRequestDto Request body with user registration details.
     * @return ResponseEntity with the registered user's details.
     */
    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@RequestBody SignUpRequestDto signupRequestDto) {
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }

}
