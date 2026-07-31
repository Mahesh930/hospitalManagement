package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.entity.ChargeMaster;
import com.mahesh.hospitalManagement.entity.DiagnosisCatalogue;
import com.mahesh.hospitalManagement.entity.MedicineCatalogue;
import com.mahesh.hospitalManagement.repository.ChargeMasterRepository;
import com.mahesh.hospitalManagement.repository.DiagnosisCatalogueRepository;
import com.mahesh.hospitalManagement.repository.MedicineCatalogueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MasterDataService {

    private final MedicineCatalogueRepository medicineRepository;
    private final DiagnosisCatalogueRepository diagnosisRepository;
    private final ChargeMasterRepository chargeRepository;
    private final AuditService auditService;

    @Transactional
    public MedicineCatalogue addMedicine(MedicineCatalogue medicine, String currentUser) {
        MedicineCatalogue saved = medicineRepository.save(medicine);
        auditService.logAction(currentUser, "ADD_MEDICINE_MASTER", null, saved.getName(), null, null, null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<MedicineCatalogue> searchMedicines(String query) {
        if (query == null || query.isBlank()) {
            return medicineRepository.findAll();
        }
        return medicineRepository.findByNameContainingIgnoreCase(query);
    }

    @Transactional
    public DiagnosisCatalogue addDiagnosis(DiagnosisCatalogue diagnosis, String currentUser) {
        DiagnosisCatalogue saved = diagnosisRepository.save(diagnosis);
        auditService.logAction(currentUser, "ADD_DIAGNOSIS_MASTER", null, saved.getIcdCode(), null, null, null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DiagnosisCatalogue> searchDiagnoses(String query) {
        if (query == null || query.isBlank()) {
            return diagnosisRepository.findAll();
        }
        return diagnosisRepository.findByDescriptionContainingIgnoreCase(query);
    }

    @Transactional
    public ChargeMaster addChargeItem(ChargeMaster charge, String currentUser) {
        ChargeMaster saved = chargeRepository.save(charge);
        auditService.logAction(currentUser, "ADD_CHARGE_MASTER", null, saved.getItemCode(), null, null, null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ChargeMaster> getAllCharges() {
        return chargeRepository.findAll();
    }
}
