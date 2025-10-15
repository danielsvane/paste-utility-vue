import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSerialStore = defineStore('serial', () => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const port = ref(null)
  const shouldListen = ref(true)
  const isConnected = ref(false)
  const deviceInfo = ref(null)
  const autoConnect = ref(true)
  let reader = null

  const receiveBuffer = ref([])
  const inspectBuffer = ref([])
  const consoleMessages = ref([])

  const sentCommandBuffer = ref([''])
  const sentCommandBufferIndex = ref(0)

  const okRespTimeout = ref(false)
  let timeoutID = undefined
  let modalRef = null

  // Flag to track if a send operation is in progress
  let isSending = false

  const bootCommands = [
    'G90',
    'M260 A112 B1 S1',
    'M260 A109',
    'M260 B48',
    'M260 B27',
    'M260 S1',
    'M260 A112 B2 S1',
    'M260 A109',
    'M260 B48',
    'M260 B27',
    'M260 S1',
    'G0 F35000'
  ]

  function setModal(modal) {
    modalRef = modal
  }

  function setupEventListeners() {
    if (!navigator.serial) {
      return
    }

    // Listen for device connect events
    navigator.serial.addEventListener('connect', async (event) => {
      console.log('Serial device connected:', event)

      // If we're not currently connected and auto-connect is enabled, try to auto-connect
      if (!isConnected.value && autoConnect.value) {
        const connectedPort = event.target
        const info = connectedPort.getInfo()

        // Check if it's our vendor ID
        if (info.usbVendorId === 0x0483) {
          console.log('Our device connected, attempting to auto-connect...')
          try {
            await openPort(connectedPort)
          } catch (err) {
            console.error('Failed to auto-connect on device connection:', err)
          }
        }
      }
    })

    // Listen for device disconnect events
    navigator.serial.addEventListener('disconnect', (event) => {
      console.log('Serial device disconnected:', event)

      // Update connection state if our port was disconnected
      if (event.target === port.value) {
        isConnected.value = false
        port.value = null
        deviceInfo.value = null
      }
    })
  }

  function appendToConsole(message, direction) {
    const timestamp = new Date().toISOString()
    const dir = direction ? '[SEND]' : '[RECE]'
    const entry = `${dir} - ${timestamp} - ${message}`
    consoleMessages.value.push(entry)
  }

  function clearBuffer() {
    receiveBuffer.value = []
  }

  function clearInspectBuffer() {
    inspectBuffer.value = []
  }

  function delay(delayInms) {
    return new Promise(resolve => setTimeout(resolve, delayInms))
  }

  async function getAuthorizedPorts() {
    if (!navigator.serial) {
      return []
    }

    const usbVendorId = 0x0483
    const ports = await navigator.serial.getPorts()

    // Filter for our specific vendor ID
    return ports.filter(p => {
      const info = p.getInfo()
      return info.usbVendorId === usbVendorId
    })
  }

  async function openPort(portToOpen) {
    await portToOpen.open({
      baudRate: 115200,
      bufferSize: 255,
      dataBits: 8,
      flowControl: 'none',
      parity: 'none',
      stopBits: 1
    })

    console.log('Port Opened.')
    port.value = portToOpen

    // Store device info
    deviceInfo.value = portToOpen.getInfo()

    listen()

    isConnected.value = true

    // Send boot commands
    await send(bootCommands)
    await send(['M150 P255 R255 U255 B255'])

    return true
  }

  async function tryAutoConnect() {
    // Only auto-connect if the setting is enabled
    if (!autoConnect.value) {
      return false
    }

    try {
      const authorizedPorts = await getAuthorizedPorts()

      if (authorizedPorts.length > 0) {
        console.log('Found previously authorized port, auto-connecting...')
        return await openPort(authorizedPorts[0])
      }

      return false
    } catch (err) {
      console.error('Auto-connect failed:', err)
      return false
    }
  }

  async function connect() {
    if (!navigator.serial) {
      modalRef?.show(
        'Browser Support',
        "Please use a browser that supports WebSerial, like Chrome, Opera, or Edge. <a href='https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility'>Supported Browsers."
      )
      return false
    }

    // First, check if we have previously authorized ports
    const authorizedPorts = await getAuthorizedPorts()

    if (authorizedPorts.length > 0) {
      console.log('Reconnecting to previously authorized port...')
      return await openPort(authorizedPorts[0])
    }

    // If no authorized ports, show the picker
    const usbVendorId = 0x0483
    const selectedPort = await navigator.serial.requestPort({ filters: [{ usbVendorId }] })
    console.log('Port Selected.')

    return await openPort(selectedPort)
  }

  async function disconnect() {
    if (!port.value) {
      return
    }

    try {
      // Stop listening - this will cause the reader to exit its loop
      shouldListen.value = false

      // Cancel the reader if it exists
      if (reader) {
        try {
          await reader.cancel()
        } catch (cancelErr) {
          console.warn('Error canceling reader:', cancelErr)
        }
      }

      // Wait for the listen loop to fully exit and release the lock
      await delay(100)

      // Close the port
      if (port.value) {
        try {
          await port.value.close()
        } catch (closeErr) {
          // Port might already be closed or in a bad state
          console.warn('Port close warning:', closeErr)
        }
      }

      // Clear state
      isConnected.value = false
      port.value = null
      deviceInfo.value = null
      reader = null

      // Re-enable listening for future connections
      shouldListen.value = true

      console.log('Disconnected successfully')
    } catch (err) {
      console.error('Error disconnecting:', err)
      // Still clear state even if there was an error
      isConnected.value = false
      port.value = null
      deviceInfo.value = null
      reader = null
      shouldListen.value = true
      throw err
    }
  }

  async function listen() {
    while (port.value?.readable && shouldListen.value) {
      console.log('Port is readable: Starting to listen.')
      let metabuffer = ''
      reader = port.value.readable.getReader()
      try {
        while (shouldListen.value) {
          const { value, done } = await reader.read()
          if (done) {
            console.log('Closing reader.')
            break
          }

          const decoded = decoder.decode(value)
          metabuffer = metabuffer.concat(decoded)

          while (metabuffer.indexOf('\n') != -1) {
            let splitted = metabuffer.split('\n')

            receiveBuffer.value.push(splitted[0])
            appendToConsole(splitted[0], false)
            inspectBuffer.value.push(splitted[0])

            metabuffer = metabuffer.split('\n').slice(1).join('\n')
          }
        }
      } catch (error) {
        console.error('Reading error.', error)
      } finally {
        reader.releaseLock()
        reader = null
      }
    }
  }

  async function setOkRespTimeout() {
    new Promise(resolve => {
      timeoutID = setTimeout(() => {
        console.log('timeout triggered')
        okRespTimeout.value = true
        resolve()
      }, 5000)
    })
  }

  async function send(commands) {
    // Ignore new commands if already sending
    if (isSending) {
      console.log('Already sending, ignoring new command')
      return
    }

    // Accept either a string or array
    const commandArray = Array.isArray(commands) ? commands : [commands]

    console.log('sending: ', commandArray)

    isSending = true
    try {
      if (port.value?.writable) {
        const writer = await port.value.writable.getWriter()
        try {
          for (const element of commandArray) {
            await writer.write(encoder.encode(element + '\n'))

            setOkRespTimeout()
            appendToConsole(element, true)

            // Check that we got an ok back
            clearBuffer()

            while (true) {
              if (okRespTimeout.value) break

              let firstElement = receiveBuffer.value.shift()

              if (firstElement == 'ok') {
                clearTimeout(timeoutID)
                break
              }

              if (firstElement == 'echo:busy: processing') {
                clearTimeout(timeoutID)
                setOkRespTimeout()
              }

              await new Promise(resolve => setTimeout(resolve, 50))
            }

            okRespTimeout.value = false
          }
        } finally {
          writer.releaseLock()
        }
      } else {
        modalRef?.show('Cannot Write', 'Cannot write to port. Have you connected?')
      }
    } finally {
      isSending = false
    }
  }

  function sendRepl(command) {
    // Adding current command to buffer for up arrow access later
    sentCommandBuffer.value.splice(1, 0, command)
    sentCommandBufferIndex.value = 0
    send(command)
  }

  async function readLeftVac() {
    if (!port.value?.writable) {
      modalRef?.show('Cannot Write', 'Cannot write to port. Have you connected?')
      return false
    }

    const commandArrayLeft = ['M260 A112 B1 S1']
    const delayVal = 50

    clearInspectBuffer()

    let msb, csb, lsb
    const regex = new RegExp('data:(..)')

    await send(commandArrayLeft)
    clearInspectBuffer()

    await send(['M260 A109 B6 S1'])
    await send(['M261 A109 B1 S1'])
    await delay(delayVal)

    for (let i = 0; i < inspectBuffer.value.length; i++) {
      let currLine = inspectBuffer.value[i]
      let result = regex.test(currLine)
      if (result) {
        msb = currLine.match('data:(..)')[1]
        break
      }
    }

    clearInspectBuffer()

    await send(['M260 A109 B7 S1'])
    await send(['M261 A109 B1 S1'])
    await delay(delayVal)

    for (let i = 0; i < inspectBuffer.value.length; i++) {
      let currLine = inspectBuffer.value[i]
      let result = regex.test(currLine)
      if (result) {
        csb = currLine.match('data:(..)')[1]
        break
      }
    }

    clearInspectBuffer()

    await send(['M260 A109 B8 S1'])
    await send(['M261 A109 B1 S1'])
    await delay(delayVal)

    for (let i = 0; i < inspectBuffer.value.length; i++) {
      let currLine = inspectBuffer.value[i]
      let result = regex.test(currLine)
      if (result) {
        lsb = currLine.match('data:(..)')[1]
        break
      }
    }

    console.log(msb, csb, lsb)

    let result = parseInt(msb + csb + lsb, 16)

    if (result & (1 << 23)) {
      result = result - 2 ** 24
    }

    await modalRef?.show('Left Vacuum Sensor Value', result)
    clearInspectBuffer()
  }


  function download(filename, text) {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  async function grabBoardPosition() {
    console.log('Grabbing board position')
    clearInspectBuffer()

    await send(['G92'])

    console.log('Sent G92')

    const pattern = /X:(.*?) Y:(.*?) Z:(.*?) A:(.*?) B:(.*?) /
    const re = new RegExp(pattern, 'i')

    console.log('Serial inspect buffer:', inspectBuffer.value)

    let positionArray = []

    for (let i = 0; i < inspectBuffer.value.length; i++) {
      let currLine = inspectBuffer.value[i]
      console.log(currLine)

      let result = re.test(currLine)

      if (result) {
        const matches = re.exec(currLine)
        positionArray = [matches[1], matches[2], matches[3]]
        break
      }
    }

    console.log('Position array:', positionArray)

    return positionArray
  }

  return {
    // State
    port,
    isConnected,
    deviceInfo,
    autoConnect,
    consoleMessages,
    receiveBuffer,
    inspectBuffer,
    sentCommandBuffer,
    sentCommandBufferIndex,

    // Methods
    setModal,
    setupEventListeners,
    getAuthorizedPorts,
    tryAutoConnect,
    connect,
    disconnect,
    send,
    sendRepl,
    clearBuffer,
    clearInspectBuffer,
    readLeftVac,
    delay,
    download,
    grabBoardPosition
  }
}, {
  persist: {
    pick: ['autoConnect']
  }
})
