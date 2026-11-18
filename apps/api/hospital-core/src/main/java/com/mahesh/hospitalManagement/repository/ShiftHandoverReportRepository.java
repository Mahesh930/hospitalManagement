package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.ShiftHandoverReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftHandoverReportRepository extends JpaRepository<ShiftHandoverReport, UUID> {

    List<ShiftHandoverReport> findByWardIdAndDeletedAtIsNullOrderByHandoverTimeDesc(UUID wardId);

    List<ShiftHandoverReport> findByWardIdAndShiftDateAndDeletedAtIsNullOrderByHandoverTimeDesc(
            UUID wardId, LocalDate shiftDate);
}
