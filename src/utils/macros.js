import { SAFE_Z_HEIGHT, PRESSURE_AMOUNT } from '../constants'
import { useSerialStore } from '../stores/serial'

/**
 * G-code macro functions for machine control
 * All functions internally use the serial store to send commands
 */

const serialStore = useSerialStore()

// ============================================================================
// MOVEMENT MACROS
// ============================================================================

/**
 * Move to absolute XY position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export async function goTo(x, y) {
  await serialStore.send([`G0 X${x} Y${y}`])
}

/**
 * Move relative to current position
 * @param {number} x - X distance to move
 * @param {number} y - Y distance to move
 */
export async function goToRelative(x, y) {
  await serialStore.send(['G91', `G0 X${x} Y${y}`, 'G90'])
}

// ============================================================================
// JOG MACROS
// ============================================================================

/**
 * Jog Y axis forward (positive direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogYPlus(distance) {
  await serialStore.send(['G91', `G0 Y${distance}`, 'G90'])
}

/**
 * Jog Y axis backward (negative direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogYMinus(distance) {
  await serialStore.send(['G91', `G0 Y-${distance}`, 'G90'])
}

/**
 * Jog X axis forward (positive direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogXPlus(distance) {
  await serialStore.send(['G91', `G0 X${distance}`, 'G90'])
}

/**
 * Jog X axis backward (negative direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogXMinus(distance) {
  await serialStore.send(['G91', `G0 X-${distance}`, 'G90'])
}

/**
 * Jog Z axis up (positive direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogZPlus(distance) {
  await serialStore.send(['G91', `G0 Z-${distance}`, 'G90'])
}

/**
 * Jog Z axis down (negative direction)
 * @param {number} distance - Distance to jog in mm
 */
export async function jogZMinus(distance) {
  await serialStore.send(['G91', `G0 Z${distance}`, 'G90'])
}

// ============================================================================
// EXTRUSION MACROS (for controls - B axis movement)
// ============================================================================

/**
 * Quick extrude movement (controls version)
 * @param {number} amount - Amount to extrude (default 2mm)
 */
export async function extrude(amount = 50) {
  await serialStore.send(['G91', `G0 B-${amount}`, 'G90'])
}

/**
 * Quick retract movement (controls version)
 * @param {number} amount - Amount to retract (default 2mm)
 */
export async function retract(amount = 50) {
  await serialStore.send(['G91', `G0 B${amount}`, 'G90'])
}

// ============================================================================
// PASTE DISPENSING MACROS
// ============================================================================

/**
 * Pressurize the paste dispenser
 */
export async function pressurize() {
  await serialStore.send(['G91', `G0 B-${PRESSURE_AMOUNT}`, 'G90'])
}

/**
 * Depressurize the paste dispenser
 */
export async function depressurize() {
  await serialStore.send(['G91', `G0 B${PRESSURE_AMOUNT}`, 'G90'])
}

/**
 * Extrude paste (job version with larger amount)
 * @param {number} amount - Amount to extrude (default 10mm)
 */
export async function extrudePaste(amount = 10) {
  await serialStore.send(['G91', `G0 B-${amount}`, 'G90'])
}

/**
 * Start continuous slow extrusion
 */
export async function startSlowExtrude() {
  await serialStore.send(['G91', 'G1 B-20000 F2000', 'G90'])
}

/**
 * Stop extrusion immediately
 */
export async function stopExtrude() {
  await serialStore.send(['M410', 'G90', 'G0 F35000'])
}

/**
 * Retract and raise to safe height
 * @param {number} retractionAmount - Amount to retract (default 10mm)
 */
export async function retractAndRaise(retractionAmount = 10) {
  await serialStore.send(['G91', `G0 B${retractionAmount}`, 'G90', `G0 Z${SAFE_Z_HEIGHT}`])
}

// ============================================================================
// RING LIGHT MACROS
// ============================================================================

/**
 * Turn ring lights on to full brightness (white)
 */
export async function ringLightsOn() {
  await serialStore.send(['M150 P255 R255 U255 B255'])
}

/**
 * Turn ring lights off
 */
export async function ringLightsOff() {
  await serialStore.send(['M150 P0'])
}

// ============================================================================
// AIR CONTROL MACROS
// ============================================================================

/**
 * Turn left air on
 */
export async function leftAirOn() {
  await serialStore.send(['M106', 'M106 P1 S255'])
}

/**
 * Turn left air off
 */
export async function leftAirOff() {
  await serialStore.send(['M107', 'M107 P1'])
}

/**
 * Read left vacuum sensor
 */
export async function leftVac() {
  await serialStore.send(['M260 A112 B1 S1'])
  await serialStore.send(['M260 A109 B6 S1'])
  await serialStore.send(['M261 A109 B1 S1'])
}

// ============================================================================
// STEPPER CONTROL MACROS
// ============================================================================

/**
 * Disable all steppers
 */
export async function disableSteppers() {
  await serialStore.send(['M18'])
}
