import cvPromise from '@techstark/opencv-js'

let cvInstance = null

export function getOpenCV() {
  return cvInstance
}

export function logOpenCVVersion(cv) {
  try {
    const buildInfo = cv.getBuildInformation()

    // Try to extract just the version number for easy reference
    const versionMatch = buildInfo.match(/General configuration for OpenCV ([\d.]+)/)
    if (versionMatch) {
      console.log(`OpenCV Version: ${versionMatch[1]}`)
    }
  } catch (error) {
    console.warn('Could not retrieve OpenCV build information:', error)
  }
}

export async function onOpenCVReady(callback) {
  // @techstark/opencv-js exports a promise that resolves when cv is ready
  try {
    const cv = await cvPromise
    cvInstance = cv
    callback(cv)
  } catch (error) {
    console.error('Failed to load OpenCV:', error)
  }
}
