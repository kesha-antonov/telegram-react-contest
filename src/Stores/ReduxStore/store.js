import { createStore } from 'redux'
import reducers from './reducers'
import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['stickersPicker', 'palette'],
    version: 'v2',
}

const rootReducer = combineReducers(reducers)

const persistedReducer = persistReducer(persistConfig, rootReducer)

export default () => {
    const store = createStore(persistedReducer)
    let persistor = persistStore(store, null, () => {
        console.log('rehydrated', store.getState())
    })
    return { store, persistor }
}
