import { SET_CURRENT_CHAT_ID } from '../actions'

export default function currentChatId(state = null, action) {
    switch (action.type) {
        case SET_CURRENT_CHAT_ID:
            return action.chatId
    }

    return state
}
