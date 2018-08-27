import { ZoneWidget } from 'monaco-editor/esm/vs/editor/contrib/zoneWidget/zoneWidget'

export default class ConditionalBreakpointWidget extends ZoneWidget {
  constructor (editor) {
    super(editor, {
      showFrame: true,
      showArrow: true,
      frameWidth: 1
    })
  }

  _fillContainer(container) {
    // TODO
  }

  _onWidth(width) {
    // TODO
  }

  _doLayout(height, width) {
    // TODO
  }
}
