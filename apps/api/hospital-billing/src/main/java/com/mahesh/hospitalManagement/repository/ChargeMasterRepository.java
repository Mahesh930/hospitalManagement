package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.ChargeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargeMasterRepository extends JpaRepository<ChargeMaster, UUID> {
    Optional<ChargeMaster> findByItemCode(String itemCode);
}
