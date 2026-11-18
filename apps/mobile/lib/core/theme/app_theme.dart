import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const Color primaryTeal = Color(0xFF0F766E);
  static const Color primaryTealDark = Color(0xFF0D5C56);
  static const Color surfaceSlate = Color(0xFFF1F5F9);
  static const Color cardSlate = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color borderSubtle = Color(0xFFE2E8F0);
  static const Color errorClinical = Color(0xFFB91C1C);

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryTeal,
        primary: primaryTeal,
        onPrimary: Colors.white,
        secondary: const Color(0xFF334155),
        surface: surfaceSlate,
        onSurface: textPrimary,
        error: errorClinical,
      ),
      scaffoldBackgroundColor: surfaceSlate,
      cardTheme: CardThemeData(
        color: cardSlate,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderSubtle),
        ),
        margin: const EdgeInsets.symmetric(vertical: 6),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: cardSlate,
        foregroundColor: textPrimary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardSlate,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryTeal, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: cardSlate,
        indicatorColor: primaryTeal.withValues(alpha: 0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.outfit(
            fontSize: 12,
            fontWeight:
                states.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? primaryTeal : textSecondary,
          );
        }),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: cardSlate,
        selectedIconTheme: const IconThemeData(color: primaryTeal),
        selectedLabelTextStyle: GoogleFonts.outfit(
          fontWeight: FontWeight.w600,
          color: primaryTeal,
        ),
        unselectedLabelTextStyle: GoogleFonts.outfit(color: textSecondary),
      ),
    );

    return base.copyWith(
      textTheme: GoogleFonts.outfitTextTheme(base.textTheme).apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),
    );
  }
}