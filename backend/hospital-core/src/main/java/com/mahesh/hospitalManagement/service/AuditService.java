package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.entity.AuditLog;
import com.mahesh.hospitalManagement.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void logAction(String username, String action, String oldValue, String newValue, String ipAddress, String device, String organization) {
        AuditLog log = AuditLog.builder()
                .username(username != null ? username : "SYSTEM")
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress != null ? ipAddress : "UNKNOWN")
                .device(device != null ? device : "UNKNOWN")
                .organization(organization != null ? organization : "DEFAULT")
                .build();
        auditLogRepository.save(log);
    }
}
