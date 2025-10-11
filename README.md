# LumenPnP Paste Utility - Vue 3 Edition

A Vue 3 rewrite of the LumenPnP Paste Utility with Tailwind CSS styling.

## Features

- **Vue 3** with Composition API for reactive state management
- **Pinia** for centralized job state
- **Tailwind CSS** for modern, utility-first styling
- **Vite** for fast development and optimized builds
- **OpenCV.js** integration for computer vision
- **Web Serial API** for machine communication

## Project Structure

```
src/
├── components/          # Vue components
│   ├── JobControls.vue
│   ├── VideoControls.vue
│   ├── ModalDialog.vue
│   └── ToastNotification.vue
├── composables/         # Reusable logic
│   ├── useSerial.js    # Serial communication
│   ├── useLumen.js     # Machine control
│   ├── useVideo.js     # Video feed management
│   └── useOpenCV.js    # OpenCV integration
├── stores/             # Pinia stores
│   └── job.js          # Job state management
├── views/              # Page components
│   └── HomeView.vue
├── router/             # Vue Router
└── assets/             # Styles and static files
```

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- Modern browser with Web Serial API support (Chrome, Edge, Opera)

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Connect**: Select your camera and click "Connect" to establish serial connection with the LumenPnP
2. **Load Job**: Import a job JSON file or load from Gerber files (paste + mask layers)
3. **Calibrate**: Use fiducial calibration to align the board
4. **Run**: Execute the paste dispensing job

## Key Components

### Composables

- **useSerial**: Manages Web Serial API communication, G-code sending, and response handling
- **useVideo**: Handles webcam feed, OpenCV processing, and fiducial detection
- **useLumen**: Machine-specific logic for jogging, position capture, etc.
- **useOpenCV**: Bridge to opencv.js global object

### Pinia Store

- **job**: Manages placements, fiducials, settings, calibration data, and file import/export

### Components

- **JobControls**: Left panel with job management, settings, and visualization
- **VideoControls**: Right panel with video feed, jog controls, and G-code console
- **ModalDialog**: Reusable modal for confirmations and inputs
- **ToastNotification**: Non-blocking notifications

## Migration from Original

All functionality from the original vanilla JS + custom CSS version has been ported to:

- **Vue 3 Composition API** for better reactivity and code organization
- **Tailwind CSS** replacing custom CSS with utility classes
- **Pinia** for centralized state instead of class instances
- **Composables** for reusable logic instead of class methods

## License

MPL 2.0 (see original project for full license details)

## Notes

- This is a client-side only application - no backend required
- Requires hardware connection to LumenPnP machine for full functionality
- OpenCV.js is loaded from `/public/opencv.js` (copied from original project)
