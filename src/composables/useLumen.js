import { ref } from 'vue'
import { useJobStore } from '../stores/job'

export function useLumen(serial, video) {
  const jobStore = useJobStore()

  async function grabBoardPosition() {
    console.log('grabbing board position')
    serial.clearInspectBuffer()

    await serial.send(['G92'])

    console.log('sent G92')

    const pattern = /X:(.*?) Y:(.*?) Z:(.*?) A:(.*?) B:(.*?) /
    const re = new RegExp(pattern, 'i')

    console.log('serial inspect buffer: ', serial.inspectBuffer.value)

    let positionArray = []

    for (let i = 0; i < serial.inspectBuffer.value.length; i++) {
      let currLine = serial.inspectBuffer.value[i]
      console.log(currLine)

      let result = re.test(currLine)

      if (result) {
        const matches = re.exec(currLine)
        positionArray = [matches[1], matches[2], matches[3]]
        break
      }
    }

    console.log('positionArray: ', positionArray)

    // Store in job store if valid
    if (positionArray.length === 3) {
      jobStore.roughBoardPosition = {
        x: parseFloat(positionArray[0]),
        y: parseFloat(positionArray[1]),
        z: parseFloat(positionArray[2])
      }
    }

    return positionArray
  }

  async function jogToFiducial() {
    const circle = video.CVdetectCircle()

    // Set a 1 second timer to show whatever's in video.cvFrame
    video.displayCvFrame(1000)

    // If we got a circle
    if (circle) {
      const [x_px, y_px] = circle

      const centerX = video.canvas.value.width / 2
      const centerY = video.canvas.value.height / 2
      const offsetX = x_px - centerX
      const offsetY = -(y_px - centerY) // Invert Y coordinate

      const scalingFactor = 0.02
      const scaledOffsetX = offsetX * scalingFactor
      const scaledOffsetY = offsetY * scalingFactor

      // Send jog commands using relative positioning
      await serial.goToRelative(scaledOffsetX.toFixed(1), scaledOffsetY.toFixed(1))
    }
  }

  return {
    grabBoardPosition,
    jogToFiducial
  }
}
