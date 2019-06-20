import { Map } from 'immutable'
import { ADD_CHAT, UPDATE_CHAT, REMOVE_CHAT } from '../actions'

const initialState = Map({})

export default function chats(state = initialState, action) {
    switch (action.type) {
        case ADD_CHAT:
        case UPDATE_CHAT:
            return state.set(action.chat.id.toString(), action.chat)
        case REMOVE_CHAT:
            return state.delete(action.chat.id.toString())
    }

    return state
}
