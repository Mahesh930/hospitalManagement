package com.mahesh.hospitalManagement.security;

import com.mahesh.hospitalManagement.dto.LoginRequestDto;
import com.mahesh.hospitalManagement.dto.LoginResponseDto;
import com.mahesh.hospitalManagement.dto.SignUpRequestDto;
import com.mahesh.hospitalManagement.dto.SignupResponseDto;
import com.mahesh.hospitalManagement.entity.Patient;
import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.PatientRepository;
import com.mahesh.hospitalManagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuthUtil authUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PatientRepository patientRepository;

    /**
     * Authenticates a user and generates a JWT access token.
     * @param loginRequestDto Request body with username and password.
     * @return LoginResponseDto containing the access token and user ID.
     */
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDto.getUsername(), loginRequestDto.getPassword())
        );

        User user = (User) authentication.getPrincipal();

        String token = authUtil.generateAccessToken(user);

        return new LoginResponseDto(token,user.getId());
    }

    /**
     * Internal method to handle user registration logic for both email and OAuth2.
     * Creates both a User entity and a corresponding Patient entity.
     * @param signupRequestDto Request body with user registration details.
     * @param authProviderType Type of authentication provider (e.g., EMAIL, GOOGLE).
     * @param providerId Unique ID from the provider (null for EMAIL).
     * @return The newly created User entity.
     */
    @Transactional
    public User signUpInternal(SignUpRequestDto signupRequestDto, AuthProviderType authProviderType, String providerId){
        User user = userRepository.findByUsername(signupRequestDto.getUsername()).orElse(null);

        if(user != null ) throw new IllegalArgumentException("User is already present with this username ");

       user = User.builder()
               .username(signupRequestDto.getUsername())
               .providerId(providerId)
               .providerType(authProviderType)
               .roles(signupRequestDto.getRoles())
               .build();
       if (authProviderType == AuthProviderType.EMAIL){
           user.setPassword(passwordEncoder.encode(signupRequestDto.getPassword()));
       }

       user = userRepository.save(user);

        // Every registered user is initially created as a patient
        Patient patient = Patient.builder()
                .name(signupRequestDto.getName())
                .email(signupRequestDto.getUsername())
                .user(user)
                .build();
        patientRepository.save(patient);

       return user;
    }

    /**
     * Handles standard email-based user registration.
     * @param signupRequestDto Request body with registration details.
     * @return SignupResponseDto with user ID and username.
     */
    public SignupResponseDto signup(SignUpRequestDto signupRequestDto) {
        User user = signUpInternal(signupRequestDto, AuthProviderType.EMAIL, null);

        return new SignupResponseDto(user.getId(), user.getUsername());
    }

    /**
     * Handles login and registration logic for OAuth2 (e.g., Google login).
     * If user doesn't exist, it performs a signup first.
     * @param oAuth2User The authenticated user details from OAuth2 provider.
     * @param registrationId The provider ID (e.g., "google").
     * @return ResponseEntity with LoginResponseDto.
     */
    @Transactional
    public ResponseEntity<LoginResponseDto> handleOAuth2LoginRequest(OAuth2User oAuth2User, String registrationId) {
        // fetch providerType and providerId
        AuthProviderType authProviderType = authUtil.getProviderTypeFromRegistrationId(registrationId);
        String providerId = authUtil.determineProviderIdFromOAuth2User(oAuth2User, registrationId);

        // save the providerType and providerId info with user
        User user = userRepository.findByProviderIdAndProviderType( providerId,authProviderType).orElse(null);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User emailUser = userRepository.findByUsername(email).orElse(null);

        if (user == null && emailUser == null){
            // If user doesn't exist by provider ID or email, perform signup
            String username = authUtil.determineUsernameFromOAuth2User(oAuth2User, registrationId, providerId);
            user = signUpInternal( new SignUpRequestDto(username, null,name, Set.of(RoleType.PATIENT)), authProviderType,providerId);

        }else if(user != null){
            // If user exists by provider ID, update email if it changed
            if(email != null && !email.isBlank() && !email.equals(user.getUsername()) ){
                user.setUsername(email);
                userRepository.save(user);
            }
        }else {
            // User exists by email but not by provider ID - potential security issue or duplicate account
            throw new BadCredentialsException("This email is already registered with provider "+ emailUser.getProviderType());
        }

        // Generate access token for the authenticated user
        LoginResponseDto loginResponseDto = new LoginResponseDto(authUtil.generateAccessToken(user), user.getId());

        return ResponseEntity.ok(loginResponseDto);
    }
}