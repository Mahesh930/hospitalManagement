import 'package:flutter/material.dart';

/// Hospital role identifiers matching backend [RoleType].
class RoleCodes {
  RoleCodes._();

  static const superAdmin = 'SUPER_ADMIN';
  static const admin = 'ADMIN';
  static const doctor = 'DOCTOR';
  static const nurse = 'NURSE';
  static const patient = 'PATIENT';
  static const receptionist = 'RECEPTIONIST';
  static const cashier = 'CASHIER';
  static const accountant = 'ACCOUNTANT';
  static const tpaInsurance = 'TPA_INSURANCE';
  static const mrd = 'MRD';
  static const pharmacist = 'PHARMACIST';
  static const labTech = 'LAB_TECH';
  static const labManager = 'LAB_MANAGER';
  static const radiologist = 'RADIOLOGIST';
  static const radiologyTech = 'RADIOLOGY_TECH';
  static const bloodBank = 'BLOOD_BANK';
  static const otCoordinator = 'OT_COORDINATOR';
  static const anesthetist = 'ANESTHETIST';
  static const physiotherapist = 'PHYSIOTHERAPIST';
  static const hrAdmin = 'HR_ADMIN';
  static const qualityOfficer = 'QUALITY_OFFICER';

  static const all = <String>[
    superAdmin,
    admin,
    doctor,
    nurse,
    patient,
    receptionist,
    cashier,
    accountant,
    tpaInsurance,
    mrd,
    pharmacist,
    labTech,
    labManager,
    radiologist,
    radiologyTech,
    bloodBank,
    otCoordinator,
    anesthetist,
    physiotherapist,
    hrAdmin,
    qualityOfficer,
  ];
}

/// Primary navigation destinations in the app shell.
enum AppNavModule {
  dashboard,
  patients,
  appointments,
  billing,
  lab,
  pharmacy,
  nurse,
  reception,
  rolesCatalog,
  station,
}

class NavDestination {
  const NavDestination({
    required this.module,
    required this.label,
    required this.icon,
    required this.route,
  });

  final AppNavModule module;
  final String label;
  final IconData icon;
  final String route;
}

const kAllDestinations = <NavDestination>[
  NavDestination(
    module: AppNavModule.dashboard,
    label: 'Home',
    icon: Icons.dashboard_outlined,
    route: '/home/dashboard',
  ),
  NavDestination(
    module: AppNavModule.patients,
    label: 'Patients',
    icon: Icons.people_outline,
    route: '/home/patients',
  ),
  NavDestination(
    module: AppNavModule.appointments,
    label: 'Appointments',
    icon: Icons.event_note_outlined,
    route: '/home/appointments',
  ),
  NavDestination(
    module: AppNavModule.billing,
    label: 'Billing',
    icon: Icons.receipt_long_outlined,
    route: '/home/billing',
  ),
  NavDestination(
    module: AppNavModule.lab,
    label: 'Laboratory',
    icon: Icons.biotech_outlined,
    route: '/home/lab',
  ),
  NavDestination(
    module: AppNavModule.pharmacy,
    label: 'Pharmacy',
    icon: Icons.local_pharmacy_outlined,
    route: '/home/pharmacy',
  ),
  NavDestination(
    module: AppNavModule.nurse,
    label: 'Nursing',
    icon: Icons.health_and_safety_outlined,
    route: '/home/nurse',
  ),
  NavDestination(
    module: AppNavModule.reception,
    label: 'Reception',
    icon: Icons.desk_outlined,
    route: '/home/reception',
  ),
  NavDestination(
    module: AppNavModule.rolesCatalog,
    label: 'Roles',
    icon: Icons.badge_outlined,
    route: '/home/roles',
  ),
  NavDestination(
    module: AppNavModule.station,
    label: 'My station',
    icon: Icons.hub_outlined,
    route: '/home/station',
  ),
];

String roleDisplayLabel(String role) {
  switch (role.toUpperCase()) {
    case RoleCodes.superAdmin:
      return 'Super Admin';
    case RoleCodes.admin:
      return 'Hospital Admin';
    case RoleCodes.doctor:
      return 'Doctor';
    case RoleCodes.nurse:
      return 'Nurse';
    case RoleCodes.patient:
      return 'Patient';
    case RoleCodes.receptionist:
      return 'Receptionist';
    case RoleCodes.cashier:
      return 'Cashier';
    case RoleCodes.accountant:
      return 'Accountant';
    case RoleCodes.tpaInsurance:
      return 'TPA / Insurance';
    case RoleCodes.mrd:
      return 'MRD';
    case RoleCodes.pharmacist:
      return 'Pharmacist';
    case RoleCodes.labTech:
      return 'Lab Technician';
    case RoleCodes.labManager:
      return 'Lab Manager';
    case RoleCodes.radiologist:
      return 'Radiologist';
    case RoleCodes.radiologyTech:
      return 'Radiology Tech';
    case RoleCodes.bloodBank:
      return 'Blood Bank';
    case RoleCodes.otCoordinator:
      return 'OT Coordinator';
    case RoleCodes.anesthetist:
      return 'Anesthetist';
    case RoleCodes.physiotherapist:
      return 'Physiotherapist';
    case RoleCodes.hrAdmin:
      return 'HR Admin';
    case RoleCodes.qualityOfficer:
      return 'Quality Officer';
    default:
      return role;
  }
}

Set<AppNavModule> modulesForRoles(List<String> roles) {
  final normalized = roles.map((r) => r.toUpperCase()).toSet();
  if (normalized.contains(RoleCodes.superAdmin) || normalized.contains(RoleCodes.admin)) {
    return AppNavModule.values.toSet();
  }

  final modules = <AppNavModule>{AppNavModule.dashboard};

  if (normalized.contains(RoleCodes.doctor) ||
      normalized.contains(RoleCodes.nurse) ||
      normalized.contains(RoleCodes.receptionist) ||
      normalized.contains(RoleCodes.mrd) ||
      normalized.contains(RoleCodes.hrAdmin) ||
      normalized.contains(RoleCodes.qualityOfficer) ||
      normalized.contains(RoleCodes.physiotherapist) ||
      normalized.contains(RoleCodes.otCoordinator)) {
    modules.add(AppNavModule.patients);
  }
  if (normalized.contains(RoleCodes.doctor) ||
      normalized.contains(RoleCodes.receptionist)) {
    modules.add(AppNavModule.appointments);
  }
  if (normalized.contains(RoleCodes.cashier) || normalized.contains(RoleCodes.accountant)) {
    modules.add(AppNavModule.billing);
  }
  if (normalized.contains(RoleCodes.labTech) || normalized.contains(RoleCodes.labManager)) {
    modules.add(AppNavModule.lab);
  }
  if (normalized.contains(RoleCodes.pharmacist)) {
    modules.add(AppNavModule.pharmacy);
  }
  if (normalized.contains(RoleCodes.nurse)) {
    modules.add(AppNavModule.nurse);
  }
  if (normalized.contains(RoleCodes.receptionist)) {
    modules.add(AppNavModule.reception);
  }

  final extended = normalized.intersection({
    RoleCodes.radiologist,
    RoleCodes.radiologyTech,
    RoleCodes.tpaInsurance,
    RoleCodes.mrd,
    RoleCodes.hrAdmin,
    RoleCodes.otCoordinator,
    RoleCodes.anesthetist,
    RoleCodes.physiotherapist,
    RoleCodes.bloodBank,
    RoleCodes.qualityOfficer,
    RoleCodes.patient,
  });
  if (extended.isNotEmpty && modules.length <= 2) {
    modules.add(AppNavModule.station);
  }

  return modules;
}

List<NavDestination> destinationsForRoles(List<String> roles) {
  final allowed = modulesForRoles(roles);
  return kAllDestinations.where((d) => allowed.contains(d.module)).toList();
}

String primaryRoleLabel(List<String> roles) {
  if (roles.isEmpty) return 'Staff';
  final priority = [
    RoleCodes.superAdmin,
    RoleCodes.admin,
    RoleCodes.doctor,
    RoleCodes.nurse,
    RoleCodes.receptionist,
    RoleCodes.pharmacist,
    RoleCodes.labManager,
    RoleCodes.labTech,
    RoleCodes.cashier,
    RoleCodes.accountant,
  ];
  for (final p in priority) {
    if (roles.map((e) => e.toUpperCase()).contains(p)) {
      return roleDisplayLabel(p);
    }
  }
  return roleDisplayLabel(roles.first);
}