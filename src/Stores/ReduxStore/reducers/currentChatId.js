import { SET_CURRENT_CHAT_ID, CLEAR_CURRENT_CHAT_ID } from '../actions'

const initialState = 0

export default function currentChatId(state = initialState, action) {
    switch (action.type) {
        case SET_CURRENT_CHAT_ID:
            return action.chatId
        case CLEAR_CURRENT_CHAT_ID:
            return initialState
    }

    return state
}
