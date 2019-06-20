import { SET_CURRENT_CHAT_ID, CLEAR_CURRENT_CHAT_ID } from '../actions'

export default function currentChatId(state = null, action) {
    switch (action.type) {
        case SET_CURRENT_CHAT_ID:
            return action.chatId
        case CLEAR_CURRENT_CHAT_ID:
            return null
    }

    return state
}
