import { createStore } from 'redux'
import reducers from './reducers'
import { combineReducers } from 'redux'

console.log('reducers', reducers)
const reduxStore = createStore(combineReducers(reducers))

export default reduxStore
