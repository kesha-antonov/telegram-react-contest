import { isChatMuted, getChatUnreadCount } from './Utils/Chat'

const appTitle = 'Telegram Web'

export default class UnreadChatsTitle {
    constructor(reduxStore) {
        this.unreadChatsCount = 0
        this.reduxStore = reduxStore
        this.unsubscribe = this.reduxStore.subscribe(this.updateUnreadChatsCount)
    }

    updateUnreadChatsCount = () => {
        const state = this.reduxStore.getState()
        const unreadChatsCount = state.chats.reduce(
            (totalCount, chat) =>
                totalCount + (isChatMuted(chat) ? 0 : getChatUnreadCount(chat) > 0 ? 1 : 0),
            0
        )

        if (unreadChatsCount !== this.unreadChatsCount) {
            this.unreadChatsCount = unreadChatsCount

            let newAppTitle = appTitle
            if (this.unreadChatsCount > 0) {
                newAppTitle = `[${this.unreadChatsCount}] ` + appTitle
            }

            document.title = newAppTitle
        }
    }

    cleanup() {
        document.title = appTitle
        this.unsubscribe()
    }
}
