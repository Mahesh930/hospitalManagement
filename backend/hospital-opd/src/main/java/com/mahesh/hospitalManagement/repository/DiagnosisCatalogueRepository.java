package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.DiagnosisCatalogue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiagnosisCatalogueRepository extends JpaRepository<DiagnosisCatalogue, UUID> {
    Optional<DiagnosisCatalogue> findByIcdCode(String icdCode);
    List<DiagnosisCatalogue> findByDescriptionContainingIgnoreCase(String description);
}
