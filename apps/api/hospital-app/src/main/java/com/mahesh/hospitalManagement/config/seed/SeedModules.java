package com.mahesh.hospitalManagement.config.seed;

/**
 * Catalog of modular seed domains (School ERP enterprise seeding pattern).
 * Implementation remains in {@code DataInitializer}; new seed logic should land
 * in dedicated classes under this package and be invoked selectively.
 */
public final class SeedModules {
    public static final String IAM = "iam";
    public static final String CLINICAL = "clinical";
    public static final String PHARMACY = "pharmacy";
    public static final String BILLING = "billing";
    public static final String DIAGNOSTICS = "diagnostics";

    private SeedModules() {}
}
