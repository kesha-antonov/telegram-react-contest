import { createStore } from 'redux'
import chatsReducer from './reducers/chatsReducer'

const reduxStore = createStore(chatsReducer)

export default reduxStore
