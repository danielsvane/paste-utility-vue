import { useSerialStore } from '../stores/serial'
import { SAFE_Z_HEIGHT } from '../constants'

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
export async function extrude(amount = 2) {
  await serialStore.send(['G91', `G0 B-${amount}`, 'G90'])
}

/**
 * Quick retract movement (controls version)
 * @param {number} amount - Amount to retract (default 2mm)
 */
export async function retract(amount = 2) {
  await serialStore.send(['G91', `G0 B${amount}`, 'G90'])
}

// ============================================================================
// PASTE DISPENSING MACROS
// ============================================================================

/**
 * Pressurize the paste dispenser
 */
export async function pressurize() {
  await serialStore.send(['G91', 'G0 B-200', 'G90'])
}

/**
 * Depressurize the paste dispenser
 */
export async function depressurize() {
  await serialStore.send(['G91', 'G0 B200', 'G90'])
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
  await serialStore.send(['G91', 'G1 B-20000 F400', 'G90'])
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
