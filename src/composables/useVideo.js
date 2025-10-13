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

  // Debug mode
  const debugMode = ref(false)
  let debugResolve = null

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


  function showFrame(frameToShow) {
    cv.imshow(canvas.value, frameToShow)
  }

  async function CVdetectCircle() {
    try {
      // Load a fresh frame to ensure no contamination from overlays
      loadNewFrame()

      // Clone frame to cvFrame
      cvFrame = frame.clone()

      let gray = new cv.Mat()
      cv.cvtColor(cvFrame, gray, cv.COLOR_RGBA2GRAY)

      // Log image stats for debugging
      const mean = cv.mean(gray)
      const minMax = cv.minMaxLoc(gray)
      console.log(`Image stats - mean: ${mean[0].toFixed(1)}, min: ${minMax.minVal}, max: ${minMax.maxVal}, size: ${gray.cols}x${gray.rows}`)

      // Original blur settings
      cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2, 2)

      // In debug mode, show the blurred grayscale image
      if (debugMode.value) {
        const grayDisplay = new cv.Mat()
        cv.cvtColor(gray, grayDisplay, cv.COLOR_GRAY2RGBA)
        cv.putText(
          grayDisplay,
          'Preprocessed (blurred grayscale)',
          new cv.Point(10, 30),
          cv.FONT_HERSHEY_SIMPLEX,
          0.7,
          new cv.Scalar(255, 255, 0, 255),
          2
        )
        cv.imshow(canvas.value, grayDisplay)
        await new Promise(resolve => setTimeout(resolve, 1000))
        grayDisplay.delete()
      }

      let circles = new cv.Mat()

      // Original parameters - scoring system handles selecting the best circle
      cv.HoughCircles(gray, circles, cv.HOUGH_GRADIENT, 1, gray.rows / 8, 50, 30, 1, 50)

      let bestCircle = null
      if (circles.cols > 0) {
        console.log(`Detected ${circles.cols} circles`)

        // Score all detected circles and pick the best one
        const centerX = cvFrame.cols / 2
        const centerY = cvFrame.rows / 2

        let bestScore = -Infinity
        let bestIndex = -1
        const circleInfo = [] // Store info for debugging

        // Draw all detected circles in gray for debugging
        for (let i = 0; i < circles.cols; i++) {
          const x = circles.data32F[i * 3]
          const y = circles.data32F[i * 3 + 1]
          const radius = circles.data32F[i * 3 + 2]

          // Calculate distance from center (normalized to 0-1)
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
          const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2)
          const normalizedDist = distFromCenter / maxDist

          // Calculate size score (prefer radius around 20 pixels)
          const idealRadius = 20
          const radiusDiff = Math.abs(radius - idealRadius)
          const sizeScore = Math.max(0, 1 - radiusDiff / idealRadius)

          // Combine scores (prefer circles close to center and appropriate size)
          // Distance weight: 70%, Size weight: 30%
          const score = (1 - normalizedDist) * 0.7 + sizeScore * 0.3

          // Store info for this circle
          circleInfo.push({ x, y, radius, distFromCenter, score, index: i })

          // Draw all circles in gray
          cv.circle(cvFrame, new cv.Point(x, y), radius, new cv.Scalar(128, 128, 128, 255), 2)

          // In debug mode, add text labels with detailed info
          if (debugMode.value) {
            const label = `#${i + 1} r=${radius.toFixed(0)} d=${distFromCenter.toFixed(0)} s=${score.toFixed(2)}`
            cv.putText(
              cvFrame,
              label,
              new cv.Point(x + radius + 5, y),
              cv.FONT_HERSHEY_SIMPLEX,
              0.4,
              new cv.Scalar(255, 255, 255, 255),
              1
            )
          }

          if (score > bestScore) {
            bestScore = score
            bestIndex = i
          }
        }

        if (bestIndex >= 0) {
          const x = circles.data32F[bestIndex * 3]
          const y = circles.data32F[bestIndex * 3 + 1]
          const radius = circles.data32F[bestIndex * 3 + 2]
          bestCircle = [x, y, radius]

          console.log(`Best circle: x=${x.toFixed(1)}, y=${y.toFixed(1)}, radius=${radius.toFixed(1)}, score=${bestScore.toFixed(3)}`)

          // Draw the best circle in green/blue
          cv.circle(cvFrame, new cv.Point(x, y), 3, new cv.Scalar(0, 255, 0, 255), -1)
          cv.circle(cvFrame, new cv.Point(x, y), radius, new cv.Scalar(0, 255, 0, 255), 4)

          // In debug mode, add "SELECTED" label
          if (debugMode.value) {
            cv.putText(
              cvFrame,
              'SELECTED',
              new cv.Point(x - 40, y - radius - 10),
              cv.FONT_HERSHEY_SIMPLEX,
              0.6,
              new cv.Scalar(0, 255, 0, 255),
              2
            )
          }
        }

        // Log all circle info in debug mode
        if (debugMode.value) {
          console.table(circleInfo)
        }
      } else {
        console.log('No circles detected')
      }

      gray.delete()
      circles.delete()

      // In debug mode, pause and wait for user to continue
      if (debugMode.value) {
        console.log('⏸️  Debug mode: Paused. Call continueDebug() or press Space to continue.')
        displayCv.value = true
        await new Promise(resolve => {
          debugResolve = resolve
        })
      }

      return bestCircle
    } catch (error) {
      console.error('Error in detectCircle:', error)
      return null
    }
  }

  function continueDebug() {
    if (debugResolve) {
      console.log('▶️  Continuing...')
      debugResolve()
      debugResolve = null
      displayCv.value = false
    }
  }

  // Add keyboard listener for debug mode
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (debugMode.value && e.code === 'Space') {
        e.preventDefault()
        continueDebug()
      }
    })
  }

  function loadNewFrame() {
    // Get the current frame for processing
    if (!canvas.value || !video.value || !frame) {
      return
    }

    const context = canvas.value.getContext('2d')
    // Clear canvas first to ensure no reticle/overlay contamination
    context.clearRect(0, 0, canvas.value.width, canvas.value.height)
    context.drawImage(video.value, 0, 0, video.value.videoWidth, video.value.videoHeight)
    const imageData = context.getImageData(0, 0, video.value.videoWidth, video.value.videoHeight)
    const tempMat = cv.matFromImageData(imageData)
    tempMat.copyTo(frame)
    tempMat.delete()
    cv.flip(frame, frame, -1)
  }

  function videoTick() {
    // Guard against hot reload or stopped video
    if (!canvas.value || !video.value || !frame) {
      return
    }

    if (displayCv.value) {
      if (cvFrame) {
        showFrame(cvFrame)
      }
    } else {
      loadNewFrame()
      showFrame(frame)
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
    displayCvFrame,
    debugMode,
    continueDebug
  }
}
