# Smoke-test login + /roles/me/station for every MediCore system role
$ErrorActionPreference = "Continue"
$base = "http://localhost:8080/api/v1"

$accounts = @(
  @{ user = "superadmin@email.com"; pass = "Password@123"; expect = "SUPER_ADMIN" },
  @{ user = "admin"; pass = "admin123"; expect = "ADMIN" },
  @{ user = "doctor"; pass = "Password@123"; expect = "DOCTOR" },
  @{ user = "nurse"; pass = "Password@123"; expect = "NURSE" },
  @{ user = "receptionist"; pass = "receptionist123"; expect = "RECEPTIONIST" },
  @{ user = "pharmacist"; pass = "pharmacist123"; expect = "PHARMACIST" },
  @{ user = "cashier"; pass = "Password@123"; expect = "CASHIER" },
  @{ user = "labtech"; pass = "Password@123"; expect = "LAB_TECH" },
  @{ user = "labmanager"; pass = "Password@123"; expect = "LAB_MANAGER" },
  @{ user = "radiologist"; pass = "Password@123"; expect = "RADIOLOGIST" },
  @{ user = "radiologytech"; pass = "Password@123"; expect = "RADIOLOGY_TECH" },
  @{ user = "accountant"; pass = "Password@123"; expect = "ACCOUNTANT" },
  @{ user = "tpainsurance"; pass = "Password@123"; expect = "TPA_INSURANCE" },
  @{ user = "mrd"; pass = "Password@123"; expect = "MRD" },
  @{ user = "hradmin"; pass = "Password@123"; expect = "HR_ADMIN" },
  @{ user = "otcoordinator"; pass = "Password@123"; expect = "OT_COORDINATOR" },
  @{ user = "anesthetist"; pass = "Password@123"; expect = "ANESTHETIST" },
  @{ user = "physiotherapist"; pass = "Password@123"; expect = "PHYSIOTHERAPIST" },
  @{ user = "bloodbank"; pass = "Password@123"; expect = "BLOOD_BANK" },
  @{ user = "qualityofficer"; pass = "Password@123"; expect = "QUALITY_OFFICER" }
)

$passCount = 0
$failCount = 0
$results = @()

Write-Host "Testing $($accounts.Count) role logins against $base ..." -ForegroundColor Cyan

foreach ($a in $accounts) {
  try {
    $loginBody = @{ username = $a.user; password = $a.pass } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $jwt = $login.jwt
    if (-not $jwt) { $jwt = $login.data.jwt }
    $roles = $login.roles
    if (-not $roles) { $roles = $login.data.roles }

    $headers = @{ Authorization = "Bearer $jwt" }
    $station = Invoke-RestMethod -Uri "$base/roles/me/station" -Headers $headers -Method GET
    $stationRoles = $station.data.roles
    if (-not $stationRoles) { $stationRoles = $station.roles }

    $hasExpected = $roles -contains $a.expect -or $stationRoles -contains $a.expect
    if ($hasExpected -and $jwt) {
      $passCount++
      $status = "PASS"
      Write-Host "[PASS] $($a.user) -> $($roles -join ',')" -ForegroundColor Green
    } else {
      $failCount++
      $status = "FAIL"
      Write-Host "[FAIL] $($a.user) expected $($a.expect) got $($roles -join ',')" -ForegroundColor Red
    }
    $results += [pscustomobject]@{ User = $a.user; Expected = $a.expect; Roles = ($roles -join ','); Status = $status }
  }
  catch {
    $failCount++
    Write-Host "[FAIL] $($a.user) :: $($_.Exception.Message)" -ForegroundColor Red
    $results += [pscustomobject]@{ User = $a.user; Expected = $a.expect; Roles = ""; Status = "FAIL: $($_.Exception.Message)" }
  }
}

Write-Host ""
Write-Host "Passed: $passCount  Failed: $failCount  Total: $($accounts.Count)" -ForegroundColor Cyan
$results | Format-Table -AutoSize
if ($failCount -gt 0) { exit 1 } else { exit 0 }
