package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.ReceptionShiftHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReceptionShiftHandoverRepository extends JpaRepository<ReceptionShiftHandover, UUID> {
    List<ReceptionShiftHandover> findByShiftDateOrderByCreatedAtDesc(LocalDate shiftDate);
    List<ReceptionShiftHandover> findAllByOrderByShiftDateDescCreatedAtDesc();
}
