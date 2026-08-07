package com.mahesh.hospitalManagement.controller;

import com.mahesh.hospitalManagement.dto.AppointmentDto;
import com.mahesh.hospitalManagement.dto.common.ApiResponse;
import com.mahesh.hospitalManagement.entity.User;
import com.mahesh.hospitalManagement.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for doctor-specific workspace actions.
 * 
 * Logic Overview:
 * - Dynamically resolves doctor identity from SecurityContext principal.
 * - Retrieves active consultation queue for the currently logged-in doctor.
 */
@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final AppointmentService appointmentService;

    /**
     * Fetches the OPD appointment queue for the logged-in doctor.
     * 
     * Logic Flow:
     * - Obtains user principal from SecurityContextHolder.
     * - Uses doctor's user ID to query checked-in appointments.
     * 
     * @return ResponseEntity with list of AppointmentDto in doctor's queue.
     */
    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getMyQueue() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<AppointmentDto> queue = appointmentService.getDoctorQueue(user.getId());
        return ResponseEntity.ok(ApiResponse.success(queue));
    }
}