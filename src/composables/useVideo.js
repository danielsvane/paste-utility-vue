import { ref } from 'vue'

export function useVideo(cv) {
  const video = ref(null)
  const canvas = ref(null)
  // Don't use refs for Mat objects - OpenCV can't work with Vue's reactive wrappers
  let frame = null
  let cvFrame = null
  const displayCv = ref(false)
  let cvDisplayTimer = null
  let processTimer = null

  async function populateCameraList() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      const cameras = videoDevices.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
        isTop: device.label && device.label.toLowerCase().includes('top')
      }))

      return cameras
    } catch (err) {
      console.error('Error populating camera list:', err)
      return []
    }
  }

  async function startVideo(cameraId, canvasElement) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: cameraId ? { exact: cameraId } : undefined
      }
    })

    video.value = document.createElement('video')
    video.value.srcObject = stream
    video.value.setAttribute('playsinline', true)
    canvas.value = canvasElement

    await new Promise(resolve => {
      video.value.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        canvas.value.width = video.value.videoWidth
        canvas.value.height = video.value.videoHeight
        resolve()
      }
    })

    await video.value.play()

    // Clean up existing frames if they exist
    if (frame) {
      frame.delete()
      frame = null
    }
    if (cvFrame) {
      cvFrame.delete()
      cvFrame = null
    }

    frame = new cv.Mat(video.value.videoHeight, video.value.videoWidth, cv.CV_8UC4)

    videoTick()
  }

  function addReticle(frameToModify) {
    const centerX = frameToModify.cols / 2
    const centerY = frameToModify.rows / 2
    const reticleSize = 20
    const reticleColor = new cv.Scalar(255, 200, 0, 255)
    const reticleThickness = 3

    let frameWithReticle = frameToModify.clone()

    // Horizontal line
    cv.line(
      frameWithReticle,
      new cv.Point(centerX - reticleSize, centerY),
      new cv.Point(centerX + reticleSize, centerY),
      reticleColor,
      reticleThickness
    )

    // Vertical line
    cv.line(
      frameWithReticle,
      new cv.Point(centerX, centerY - reticleSize),
      new cv.Point(centerX, centerY + reticleSize),
      reticleColor,
      reticleThickness
    )

    return frameWithReticle
  }

  function showFrame(frameToShow) {
    cv.imshow(canvas.value, frameToShow)
  }

  function CVdetectCircle() {
    try {
      // Clone frame to cvFrame
      cvFrame = frame.clone()

      let gray = new cv.Mat()
      cv.cvtColor(cvFrame, gray, cv.COLOR_RGBA2GRAY)
      cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2, 2)
      let circles = new cv.Mat()

      cv.HoughCircles(gray, circles, cv.HOUGH_GRADIENT, 1, gray.rows / 8, 50, 30, 1, 50)

      let bestCircle = null
      if (circles.cols > 0) {
        // Get best one
        const x = circles.data32F[0]
        const y = circles.data32F[1]
        const radius = circles.data32F[2]
        bestCircle = [x, y, radius]

        // Draw that circle
        cv.circle(cvFrame, new cv.Point(x, y), 3, new cv.Scalar(0, 255, 0, 255), -1)
        cv.circle(cvFrame, new cv.Point(x, y), radius, new cv.Scalar(255, 0, 0, 255), 3)
      }

      gray.delete()
      circles.delete()

      const frameWithReticle = addReticle(cvFrame)
      cvFrame.delete()
      cvFrame = frameWithReticle

      return bestCircle
    } catch (error) {
      console.error('Error in detectCircle:', error)
      return null
    }
  }

  function loadNewFrame() {
    // Get the current frame for processing
    const context = canvas.value.getContext('2d')
    context.drawImage(video.value, 0, 0, video.value.videoWidth, video.value.videoHeight)
    const imageData = context.getImageData(0, 0, video.value.videoWidth, video.value.videoHeight)
    const tempMat = cv.matFromImageData(imageData)
    tempMat.copyTo(frame)
    tempMat.delete()
    cv.flip(frame, frame, -1)
  }

  function videoTick() {
    if (displayCv.value) {
      showFrame(cvFrame)
    } else {
      loadNewFrame()
      const frameWithReticle = addReticle(frame)
      showFrame(frameWithReticle)
      frameWithReticle.delete()
    }

    // Set next frame to fire
    requestAnimationFrame(() => videoTick())
  }

  function displayCvFrame(time) {
    displayCv.value = true

    // Set timer to return to normal view after n seconds
    if (processTimer) {
      clearTimeout(processTimer)
    }

    processTimer = setTimeout(() => {
      displayCv.value = false
      if (cvFrame) {
        cvFrame.delete()
        cvFrame = null
      }
      processTimer = null
    }, time)
  }

  function stopVideo() {
    if (processTimer) {
      clearTimeout(processTimer)
      processTimer = null
    }

    if (cvFrame) {
      cvFrame.delete()
      cvFrame = null
    }

    if (video.value && video.value.srcObject) {
      video.value.srcObject.getTracks().forEach(track => track.stop())
      video.value.remove()
      video.value = null
    }

    if (frame) {
      frame.delete()
      frame = null
    }

    if (canvas.value) {
      const ctx = canvas.value.getContext('2d')
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    }

    console.log('Video stopped and cleaned up')
  }

  return {
    canvas,
    video,
    populateCameraList,
    startVideo,
    stopVideo,
    CVdetectCircle,
    displayCvFrame
  }
}
