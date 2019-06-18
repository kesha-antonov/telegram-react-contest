import { Map } from 'immutable'
import { combineReducers } from 'redux'
import { ADD_CHAT, UPDATE_CHAT, REMOVE_CHAT, SET_CURRENT_CHAT_ID } from '../actions'

const initialState = Map({})

function chats(state = initialState, action) {
    switch (action.type) {
        case ADD_CHAT:
        case UPDATE_CHAT:
            return state.set(action.chat.id.toString(), action.chat)
        case REMOVE_CHAT:
            return state.delete(action.chat.id.toString())
    }

    return state
}

function currentChatId(state = null, action) {
    switch (action.type) {
        case SET_CURRENT_CHAT_ID:
            return action.chatId
    }

    return state
}

const chatsReducer = combineReducers({
    chats,
    currentChatId
})

export default chatsReducer
