import React from 'react'
import { connect } from 'react-redux'
import Dialog from '../components/Dialog'
import Button from '../components/Button'

/**
 * Component that shows dialogs when the service worker (for offline support) is updated or installed.
 */
class OfflineHandler extends React.Component {
  state = {
    showUpdateDialog: false,
    showOfflineHintDialog: false
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.updateAvailable && !this.props.updateAvailable) {
      this.setState({ showUpdateDialog: true })
    }
    if (nextProps.installed && !this.props.installed) {
      this.setState({ showOfflineHintDialog: true })
    }
  }

  handleReload = () => window.location.reload()

  handleCloseUpdateDialog = () => this.setState({ showUpdateDialog: false })

  render () {
    return (
      <React.Fragment>
        <Dialog
          width={400}
          open={this.state.showUpdateDialog}
          title='Update available'
          buttons={[
            <Button
              key='cancel'
              onClick={this.handleCloseUpdateDialog}
            >
              Not now
            </Button>,
            <Button
              key='reload'
              primary
              onClick={this.handleReload}
            >
              Reload
            </Button>
          ]}
        >
          An update for the PostFix WebIDE is available. Reload the page to get the latest features and improvements.
        </Dialog>
        <Dialog
          width={400}
          open={this.state.showOfflineHintDialog}
          title='Offline support'
          onClose={this.handleCloseOfflineHintDialog}
          buttons={[
            <Button
              key='ok'
              onClick={this.handleCloseOfflineHintDialog}
            >
              OK
            </Button>
          ]}
        >
          The PostFix WebIDE was cached locally and can now be accessed even if there is no internet connection available.<br />
          Just open this page at any time and continue working offline.
        </Dialog>
      </React.Fragment>
    )
  }
}

export default connect(({ serviceWorker }) => serviceWorker)(OfflineHandler)
