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

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final AppointmentService appointmentService;

    @GetMapping("/queue")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getMyQueue() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<AppointmentDto> queue = appointmentService.getDoctorQueue(user.getId());
        return ResponseEntity.ok(ApiResponse.success(queue));
    }
}