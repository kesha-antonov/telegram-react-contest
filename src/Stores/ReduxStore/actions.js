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

// currentChatId

export const SET_CURRENT_CHAT_ID = 'SET_CURRENT_CHAT_ID'

export function setCurrentChatId(chatId) {
    return { type: SET_CURRENT_CHAT_ID, chatId }
}

// palette

export const SET_PALETTE = 'SET_PALETTE'

export function setPalette(palette, prevPalette = null) {
    console.log('setPalette', palette, prevPalette)
    return { type: SET_PALETTE, palette, prevPalette }
}
