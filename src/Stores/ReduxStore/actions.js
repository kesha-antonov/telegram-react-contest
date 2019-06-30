// chats

export const ADD_CHAT = 'ADD_CHAT'
export const UPDATE_CHAT = 'UPDATE_CHAT'
export const REMOVE_CHAT = 'REMOVE_CHAT'

export function addChat(chat) {
    return { type: ADD_CHAT, chat }
}

export function updateChat(chat) {
    return { type: UPDATE_CHAT, chat }
}

export function removeChat(chat) {
    return { type: REMOVE_CHAT, chat }
}

// currentChat

export const SCROLL_BEHAVIOR_ENUM = Object.freeze({
    NONE: 'NONE',
    SCROLL_TO_BOTTOM: 'SCROLL_TO_BOTTOM',
    SCROLL_TO_UNREAD: 'SCROLL_TO_UNREAD',
    SCROLL_TO_MESSAGE: 'SCROLL_TO_MESSAGE',
    KEEP_SCROLL_POSITION: 'KEEP_SCROLL_POSITION',
})

export const CURRENT_CHAT_CLEAR_HISTORY = 'CURRENT_CHAT_CLEAR_HISTORY'
export const CURRENT_CHAT_REPLACE_HISTORY = 'CURRENT_CHAT_REPLACE_HISTORY'
export const CURRENT_CHAT_PREPEND_HISTORY = 'CURRENT_CHAT_PREPEND_HISTORY'
export const CURRENT_CHAT_APPEND_HISTORY = 'CURRENT_CHAT_APPEND_HISTORY'
export const CURRENT_CHAT_CLEAR_SCROLL_BEHAVIOR = 'CURRENT_CHAT_CLEAR_SCROLL_BEHAVIOR'
export const SET_CURRENT_CHAT = 'SET_CURRENT_CHAT'
export const UPDATE_CURRENT_CHAT = 'UPDATE_CURRENT_CHAT'
export const CLEAR_CURRENT_CHAT = 'CLEAR_CURRENT_CHAT'
export const CURRENT_CHAT_REPLACE_MESSAGE = 'CURRENT_CHAT_REPLACE_MESSAGE'
export const CURRENT_CHAT_DELETE_HISTORY = 'CURRENT_CHAT_DELETE_HISTORY'

export function setCurrentChat(chat) {
    return { type: SET_CURRENT_CHAT, chat }
}

export function updateCurrentChat(chat) {
    return { type: UPDATE_CURRENT_CHAT, chat }
}

export function clearCurrentChat() {
    return { type: CLEAR_CURRENT_CHAT }
}

export function currentChatClearHistory() {
    return { type: CURRENT_CHAT_CLEAR_HISTORY }
}

export function currentChatReplaceHistory(history) {
    return { type: CURRENT_CHAT_REPLACE_HISTORY, history }
}

export function currentChatPrependHistory({ history, scrollBehavior }) {
    return { type: CURRENT_CHAT_PREPEND_HISTORY, history, scrollBehavior }
}

export function currentChatAppendHistory({ history, scrollBehavior }) {
    return { type: CURRENT_CHAT_APPEND_HISTORY, history, scrollBehavior }
}

export function currentChatClearScrollBehavior() {
    return { type: CURRENT_CHAT_CLEAR_SCROLL_BEHAVIOR }
}

export function currentChatReplaceMessage({ oldMessageId, message, scrollBehavior }) {
    return {
        type: CURRENT_CHAT_REPLACE_MESSAGE,
        payload: { oldMessageId, message, scrollBehavior },
    }
}

export function currentChatDeleteHistory({ messagesIds, scrollBehavior }) {
    return { type: CURRENT_CHAT_DELETE_HISTORY, payload: { messagesIds, scrollBehavior } }
}

// palette

export const SET_PALETTE = 'SET_PALETTE'

export function setPalette(palette, prevPalette = null) {
    return { type: SET_PALETTE, palette, prevPalette }
}

// stickersPicker

export const SET_IS_ACTIVE_STICKERS_PICKER = 'SET_IS_ACTIVE_STICKERS_PICKER'

export function setIsActiveStickersPicker(isActive) {
    return { type: SET_IS_ACTIVE_STICKERS_PICKER, isActive }
}
