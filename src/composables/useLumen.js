import { ref } from 'vue'

export function useLumen(serial, video) {
  const tipXoffset = ref(0)
  const tipYoffset = ref(0)

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
    tipXoffset,
    tipYoffset,
    grabBoardPosition,
    jogToFiducial
  }
}
