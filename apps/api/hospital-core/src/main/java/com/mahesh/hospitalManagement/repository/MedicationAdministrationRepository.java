package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.MedicationAdministration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationAdministrationRepository extends JpaRepository<MedicationAdministration, UUID> {

    List<MedicationAdministration> findByPatientIdAndDeletedAtIsNullOrderByAdministeredAtDesc(UUID patientId);

    List<MedicationAdministration> findByPrescriptionItemIdAndDeletedAtIsNull(UUID prescriptionItemId);

    List<MedicationAdministration> findByBedAdmissionIdAndDeletedAtIsNullOrderByAdministeredAtDesc(UUID bedAdmissionId);
}
