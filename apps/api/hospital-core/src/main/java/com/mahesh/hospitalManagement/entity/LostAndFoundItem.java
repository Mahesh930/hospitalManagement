package com.mahesh.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Entity for recording lost and found patient/visitor belongings at reception.
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "lost_and_found_items",
        indexes = {
                @Index(name = "idx_lost_item_status", columnList = "status"),
                @Index(name = "idx_lost_item_category", columnList = "category")
        }
)
@SQLRestriction("deleted_at IS NULL")
public class LostAndFoundItem extends BaseEntity {

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(length = 50)
    @Builder.Default
    private String category = "VALUABLES"; // VALUABLES, DOCUMENTS, ELECTRONICS, CLOTHING, OTHER

    @Column(length = 500)
    private String description;

    @Column(name = "found_location", nullable = false, length = 150)
    private String foundLocation;

    @Column(name = "found_date_time", nullable = false)
    private LocalDateTime foundDateTime;

    @Column(name = "found_by", length = 100)
    private String foundBy;

    @Column(name = "storage_location", length = 100)
    private String storageLocation;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "UNCLAIMED"; // UNCLAIMED, CLAIMED, DISPOSED

    @Column(name = "claimed_by", length = 100)
    private String claimedBy;

    @Column(name = "claimant_contact", length = 30)
    private String claimantContact;

    @Column(name = "claimant_id_proof", length = 100)
    private String claimantIdProof;

    @Column(name = "claimed_date_time")
    private LocalDateTime claimedDateTime;

    @Column(length = 500)
    private String remarks;
}
