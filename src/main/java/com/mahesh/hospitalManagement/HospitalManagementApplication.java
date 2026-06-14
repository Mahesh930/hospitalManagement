package com.mahesh.hospitalManagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Hospital Management Spring Boot application.
 * This application provides a backend system for managing doctors, patients, and appointments.
 * It features JWT-based authentication and OAuth2 integration.
 */
@SpringBootApplication
public class HospitalManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(HospitalManagementApplication.class, args);
	}

}
