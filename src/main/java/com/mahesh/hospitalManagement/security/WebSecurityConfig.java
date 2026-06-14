package com.mahesh.hospitalManagement.security;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;


import static com.mahesh.hospitalManagement.entity.type.PermissionType.*;
import static com.mahesh.hospitalManagement.entity.type.RoleType.*;

@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class WebSecurityConfig {

    private final PasswordEncoder passwordEncoder;
    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final HandlerExceptionResolver handlerExceptionResolver;

    /**
     * Configures the main security filter chain for the application.
     * Sets up CSRF, session management, request authorization, and authentication filters.
     * @param httpSecurity HttpSecurity object to configure.
     * @return The configured SecurityFilterChain.
     * @throws Exception if configuration fails.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                // Disable CSRF for stateless API
                .csrf(csrfConfigurer -> csrfConfigurer.disable())
                // Set session management to stateless as we use JWT
                .sessionManagement(sessionConfig ->
                        sessionConfig.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configure endpoint-based authorization
                .authorizeHttpRequests(auth-> auth
                        .requestMatchers("/public/**", "/auth/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
                                .hasAnyAuthority(APPOINTMENT_DELETE.name()
                                        ,USER_MANAGE.name())
                        .requestMatchers("/admin/**").hasRole(ADMIN.name())
                        .requestMatchers("/doctors/**").hasAnyRole(DOCTOR.name(),ADMIN.name())
                        .anyRequest().authenticated()
                )
                // Add JWT filter before the standard authentication filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // Configure OAuth2 login support
                .oauth2Login(oAuth2 -> oAuth2.failureHandler(
                        (request, response, exception) -> {
                            log.error("OAuth2 login failed: {}",exception.getMessage());
                            handlerExceptionResolver.resolveException(request,response,null,exception);
                        })
                        .successHandler(oAuth2SuccessHandler)
                )
                // Configure custom exception handling for access denial
                .exceptionHandling(exceptionHandlingConfigurer ->
                    exceptionHandlingConfigurer.accessDeniedHandler((request, response, accessDeniedException) ->{
                        handlerExceptionResolver.resolveException(request,response,null,accessDeniedException);
                    }));

        return httpSecurity.build();
    }
}
