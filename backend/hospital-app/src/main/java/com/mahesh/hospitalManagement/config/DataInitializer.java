package com.mahesh.hospitalManagement.config;

import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.entity.type.AuthProviderType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;

/**
 * Spring Boot CommandLineRunner responsible for seeding essential system accounts into the database upon application startup.
 * 
 * Logic Overview:
 * 1. Checks if default Super Admin ('superadmin@email.com') exists in UserRepository.
 * 2. If missing, creates and persists Super Admin user entity with BCrypt-encoded password ('Password@123') and SUPER_ADMIN + ADMIN roles.
 * 3. If account exists, updates password to guarantee credentials match 'Password@123'.
 * 4. Ensures fallback default 'admin' account ('admin123') is also initialized.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final com.mahesh.hospitalManagement.repository.PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed or update superadmin@email.com
        Optional<User> existingSuperAdminEmail = userRepository.findByUsername("superadmin@email.com");
        if (existingSuperAdminEmail.isEmpty()) {
            User superAdmin = User.builder()
                    .username("superadmin@email.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.SUPER_ADMIN, RoleType.ADMIN))
                    .build();
            userRepository.save(superAdmin);
            log.info("Initialized default SUPER_ADMIN user: username='superadmin@email.com', password='Password@123'");
        } else {
            User superAdmin = existingSuperAdminEmail.get();
            superAdmin.setPassword(passwordEncoder.encode("Password@123"));
            userRepository.save(superAdmin);
            log.info("Updated password for existing SUPER_ADMIN user: username='superadmin@email.com'");
        }

        // Seed legacy superadmin username fallback for compatibility
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            User legacySuperAdmin = User.builder()
                    .username("superadmin")
                    .password(passwordEncoder.encode("Password@123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.SUPER_ADMIN, RoleType.ADMIN))
                    .build();
            userRepository.save(legacySuperAdmin);
            log.info("Initialized fallback SUPER_ADMIN user: username='superadmin', password='Password@123'");
        }

        // Seed default hospital admin account
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.ADMIN))
                    .build();
            userRepository.save(admin);
            log.info("Initialized default ADMIN user: username='admin', password='admin123'");
        }

        // Seed default Receptionist user account for patient registration and check-in workflows
        if (userRepository.findByUsername("receptionist").isEmpty()) {
            User receptionist = User.builder()
                    .username("receptionist")
                    .password(passwordEncoder.encode("receptionist123"))
                    .providerType(AuthProviderType.EMAIL)
                    .roles(Set.of(RoleType.RECEPTIONIST))
                    .build();
            userRepository.save(receptionist);
            log.info("Initialized default RECEPTIONIST user: username='receptionist', password='receptionist123'");
        }

        // Auto-backfill & synchronize User accounts for all existing patients (Credentials: Email/Phone, Password: Password@123)
        var allPatients = patientRepository.findAllActivePatients();
        for (var p : allPatients) {
            String identifier = (p.getEmail() != null && !p.getEmail().isBlank()) ? p.getEmail() : p.getPhone();
            if (identifier == null || identifier.isBlank()) {
                identifier = p.getUhid();
            }
            final String userIdentifier = identifier;
            User user = userRepository.findByUsername(userIdentifier)
                    .orElseGet(() -> userRepository.findByIdentifier(userIdentifier)
                            .orElseGet(() -> {
                                User newUser = User.builder()
                                        .username(userIdentifier)
                                        .phone(p.getPhone())
                                        .password(passwordEncoder.encode("Password@123"))
                                        .providerType(AuthProviderType.EMAIL)
                                        .roles(Set.of(RoleType.PATIENT))
                                        .build();
                                return userRepository.save(newUser);
                            }));

            // Guarantee password is set to Password@123 and roles include PATIENT
            user.setPassword(passwordEncoder.encode("Password@123"));
            if (user.getPhone() == null && p.getPhone() != null) {
                user.setPhone(p.getPhone());
            }
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(Set.of(RoleType.PATIENT));
            }
            User savedUser = userRepository.save(user);

            if (p.getUser() == null || !p.getUser().getId().equals(savedUser.getId())) {
                p.setUser(savedUser);
                patientRepository.save(p);
            }
            log.info("Synchronized patient user account: username='{}', phone='{}', password='Password@123'", userIdentifier, p.getPhone());
        }
    }
}
