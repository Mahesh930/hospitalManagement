package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.MedicineCatalogue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicineCatalogueRepository extends JpaRepository<MedicineCatalogue, UUID> {
    List<MedicineCatalogue> findByNameContainingIgnoreCase(String name);
}
