import {
    SCROLL_BEHAVIOR_ENUM,
    CURRENT_CHAT_CLEAR_HISTORY,
    CURRENT_CHAT_REPLACE_HISTORY,
    CURRENT_CHAT_PREPEND_HISTORY,
    CURRENT_CHAT_APPEND_HISTORY,
    CURRENT_CHAT_CLEAR_SCROLL_BEHAVIOR,
    SET_CURRENT_CHAT,
    UPDATE_CURRENT_CHAT,
    CLEAR_CURRENT_CHAT,
    CURRENT_CHAT_REPLACE_MESSAGE,
    CURRENT_CHAT_DELETE_HISTORY,
} from '../actions'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

const initialState = {
    id: 0,
    history: [],
    selectionActive: false,
    scrollBehavior: SCROLL_BEHAVIOR_ENUM.NONE,
    separatorMessageId: 0,
    completed: false,
    suppressHandleScroll: false,
    clearHistory: false,
}

function currentChat(state = initialState, action) {
    switch (action.type) {
        case SET_CURRENT_CHAT:
            return {
                ...state,
                suppressHandleScroll: true,
                ...action.chat,
            }
        case UPDATE_CURRENT_CHAT:
            return { ...state, ...action.chat }
        case CLEAR_CURRENT_CHAT:
            return initialState
        case CURRENT_CHAT_CLEAR_HISTORY:
            return { ...state, history: [] }
        case CURRENT_CHAT_REPLACE_HISTORY:
            return {
                ...state,
                history: action.history.slice(),
                scrollBehavior: SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM,
            }
        case CURRENT_CHAT_PREPEND_HISTORY:
            return { ...state, ...action, history: action.history.concat(state.history) }
        case CURRENT_CHAT_APPEND_HISTORY:
            return { ...state, ...action, history: state.history.concat(action.history) }
        case CURRENT_CHAT_CLEAR_SCROLL_BEHAVIOR:
            return { ...state, scrollBehavior: SCROLL_BEHAVIOR_ENUM.NONE }
        case CURRENT_CHAT_REPLACE_MESSAGE: {
            const { oldMessageId, message, scrollBehavior } = action.payload

            return {
                ...state,
                scrollBehavior: scrollBehavior || state.scrollBehavior,
                // history: state.history.map(x => x.id === oldMessageId ? message: x),
                history: state.history.filter(x => x.id !== oldMessageId).concat([message]),
            }
        }
        case CURRENT_CHAT_DELETE_HISTORY: {
            const { messagesIds, scrollBehavior } = action.payload

            const map = new Map(messagesIds.map(x => [x, x]))

            return {
                ...state,
                history: state.history.filter(x => !map.has(x.id)),
                scrollBehavior: scrollBehavior || state.scrollBehavior,
            }
        }
    }

    return state
}

const persistConfig = {
    key: 'currentChat',
    storage,
    whitelist: ['id', 'messageId'],
    version: 'v1',
}

export default persistReducer(persistConfig, currentChat)
