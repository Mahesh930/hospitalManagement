package com.mahesh.hospitalManagement.security;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;

/**
 * Filter that executes once per request to validate JWT tokens.
 * If a valid token is found, it sets the authentication in the SecurityContext.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final AuthUtil authUtil;
    private final HandlerExceptionResolver handlerExceptionResolver;

    /**
     * Filters incoming requests to check for a Bearer JWT token in the Authorization header.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            log.info("Processing request: {}", request.getRequestURI());

            final String requestTokenHeader = request.getHeader("Authorization");
            
            // If no Authorization header or not a Bearer token, proceed to next filter
            if (requestTokenHeader == null || !requestTokenHeader.startsWith("Bearer")) {
                filterChain.doFilter(request, response);
                return;
            }

            // Extract token and username
            String token = requestTokenHeader.split("Bearer")[1].trim();
            String username = authUtil.getUsernameFromToken(token);

            // If username is found and security context is not already authenticated
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found from token"));
                
                // Create authentication token and set it in SecurityContext
                UsernamePasswordAuthenticationToken authentication
                        = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            log.error("JWT Authentication error: {}", ex.getMessage());
            // Delegate exception handling to the GlobalExceptionHandler
            handlerExceptionResolver.resolveException(request, response, null, ex);
        }
    }
}
