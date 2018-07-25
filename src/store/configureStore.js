import { createStore, combineReducers } from 'redux'
import * as reducers from '../reducers'

export default function (initialState) {
  const store = createStore(
    combineReducers(reducers),
    initialState,
    process.env.NODE_ENV !== 'production' && window.devToolsExtension
      ? window.devToolsExtension()
      : undefined
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      store.replaceReducer(reducers)
    })
  }

  return store
}
