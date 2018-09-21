import { createStore, combineReducers } from 'redux'
import { debounce } from 'throttle-debounce'
import * as reducers from '../reducers'

export default function (initialState) {
  const store = createStore(
    combineReducers(reducers),
    initialState,
    process.env.NODE_ENV !== 'production' && window.devToolsExtension
      ? window.devToolsExtension()
      : undefined
  )

  let previousState = store.getState()
  store.subscribe(debounce(1000, () => {
    const state = store.getState()
    if (state.code !== previousState.code) {
      localStorage.setItem('code', state.code)
    }
    if (state.settings !== previousState.settings) {
      localStorage.setItem('settings', JSON.stringify(state.settings))
    }
    previousState = state
  }))

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      store.replaceReducer(reducers)
    })
  }

  return store
}
