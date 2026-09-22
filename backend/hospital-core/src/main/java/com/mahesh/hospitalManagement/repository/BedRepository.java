package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BedRepository extends JpaRepository<Bed, UUID> {

    List<Bed> findByHospitalIdAndDeletedAtIsNull(UUID hospitalId);

    List<Bed> findByWardIdAndDeletedAtIsNull(UUID wardId);

    List<Bed> findByHospitalIdAndStatusAndDeletedAtIsNull(UUID hospitalId, String status);

    @Query("SELECT COUNT(b) FROM Bed b WHERE b.hospital.id = :hospitalId AND b.status = :status AND b.deletedAt IS NULL")
    long countByHospitalIdAndStatus(@Param("hospitalId") UUID hospitalId, @Param("status") String status);

    @Query("SELECT COUNT(b) FROM Bed b WHERE b.hospital.id = :hospitalId AND b.deletedAt IS NULL")
    long countByHospitalId(@Param("hospitalId") UUID hospitalId);
}
