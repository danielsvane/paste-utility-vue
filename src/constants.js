/**
 * Machine configuration constants
 */

// Safe Z height for travel movements (mm)
export const SAFE_Z_HEIGHT = 31.5

// Default Z height for new positions (mm)
export const DEFAULT_Z_HEIGHT = 31.5

// Extrusion height above board surface (mm)
export const EXTRUSION_HEIGHT = 0.2

// Amount to move B axis for pressurize/depressurize operations (mm)
export const PRESSURE_AMOUNT = 1000

// Prime blob configuration - 5mm circular pad
export const PRIME_PAD_DIAMETER = 5 // mm
export const PRIME_PAD_AREA = Math.PI * Math.pow(PRIME_PAD_DIAMETER / 2, 2) // ~19.63 mm²
export const PRIME_DISPENSE_DEGREES = 176 // Degrees for 5mm pad (based on ~9 deg/mm² adaptive rate)
export const PRIME_RETRACTION_DEGREES = 1
export const PRIME_DWELL_MILLISECONDS = 500
