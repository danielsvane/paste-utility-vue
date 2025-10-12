// Font Awesome Configuration
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Import specific icons here
import {
  faUserSecret,
  faHouse,
  faCheck,
  faXmark,
  faCog,
  faPlay,
  faPause,
  faStop,
  faLink,
  faLinkSlash,
  faLeftRight,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faFolderOpen,
  faFloppyDisk
} from '@fortawesome/free-solid-svg-icons'

// Add icons to the library
library.add(
  faUserSecret,
  faHouse,
  faCheck,
  faXmark,
  faCog,
  faPlay,
  faPause,
  faStop,
  faLink,
  faLinkSlash,
  faLeftRight,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowDown,
  faFolderOpen,
  faFloppyDisk
)

// Export plugin function
export default {
  install(app) {
    app.component('font-awesome-icon', FontAwesomeIcon)
  }
}
