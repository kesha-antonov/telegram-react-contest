/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events'
import InputTypingManager from '../Utils/InputTypingManager'
import UserStore from './UserStore'
import TdLibController from '../Controllers/TdLibController'
import { updateChat } from './ReduxStore/actions'

class ChatStore extends EventEmitter {
    constructor() {
        super()

        this.typingManagers = new Map()
        this.onlineMemberCount = new Map()
        this.skippedUpdates = []

        this.addTdLibListener()
        this.setMaxListeners(Infinity)
    }

    setReduxStore = reduxStore => {
        this.reduxStore = reduxStore
    }

    updateChat = (chat, newProps = {}) => {
        chat = Object.assign({}, chat, newProps)
        this.reduxStore && this.reduxStore.dispatch(updateChat(chat))
    }

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateConnectionState': {
                if (update.state['@type'] === 'connectionStateUpdating') {
                    this.updating = true
                    this.skippedUpdates = []
                } else {
                    this.updating = false
                    if (this.skippedUpdates.length > 0) {
                        TdLibController.parameters.fastUpdating = false
                        this.emitUpdate({
                            '@type': 'clientUpdateFastUpdatingComplete',
                            updates: this.skippedUpdates,
                        })
                        this.skippedUpdates = []
                    }
                }
                break
            }
            case 'updateChatDefaultDisableNotification': {
                //TODO: handle updateChatDefaultDisableNotification

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatOnlineMemberCount': {
                this.setOnlineMemberCount(update.chat_id, update.online_member_count)

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatDraftMessage': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        order: update.order === '0' ? chat.order : update.order,
                        draft_message: update.draft_message,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatIsMarkedAsUnread': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        is_marked_as_unread: update.is_marked_as_unread,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatIsPinned': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        order: update.order === '0' ? chat.order : update.order,
                        is_pinned: update.is_pinned,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatIsSponsored': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        order: update.order === '0' ? chat.order : update.order,
                        is_sponsored: update.is_sponsored,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatLastMessage': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        order: update.order === '0' ? chat.order : update.order,
                        last_message: update.last_message,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatNotificationSettings': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        notification_settings: update.notification_settings,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatOrder': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, { order: update.order })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatPhoto': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, { photo: update.photo })

                    switch (chat.type['@type']) {
                        case 'chatTypeBasicGroup': {
                            break
                        }
                        case 'chatTypeSupergroup': {
                            break
                        }
                        case 'chatTypePrivate':
                        case 'chatTypeSecret': {
                            const user = UserStore.get(chat.type.user_id)
                            if (user) {
                                UserStore.assign(user, { profile_photo: update.photo })
                            }
                            break
                        }
                    }
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatPinnedMessage': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, { pinned_message_id: update.pinned_message_id })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatReadInbox': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        last_read_inbox_message_id: update.last_read_inbox_message_id,
                        unread_count: update.unread_count,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatReadOutbox': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        last_read_outbox_message_id: update.last_read_outbox_message_id,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatReplyMarkup': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        reply_markup_message_id: update.reply_markup_message_id,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatTitle': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, { title: update.title })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateChatUnreadMentionCount': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        unread_mention_count: update.unread_mention_count,
                    })
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateNewChat': {
                this.updateChat(update.chat)

                this.emitFastUpdate(update)
                break
            }
            case 'updateSecretChat': {
                //TODO: handle updateSecretChat

                this.emitFastUpdate(update)
                break
            }
            case 'updateUnreadChatCount': {
                //TODO: handle updateUnreadChatCount

                this.emitFastUpdate(update)
                break
            }
            case 'updateUserChatAction': {
                let typingManager = this.getTypingManager(update.chat_id)
                if (!typingManager) {
                    typingManager = new InputTypingManager(update.chat_id, update =>
                        this.emitUpdate(update)
                    )
                    this.setTypingManager(update.chat_id, typingManager)
                }

                const key = update.user_id

                const chat = this.get(update.chat_id)

                switch (update.action['@type']) {
                    case 'chatActionCancel':
                        typingManager.clearAction(key)

                        if (chat) {
                            this.updateChat(chat, {
                                isTyping: false,
                            })
                        }
                        break
                    case 'chatActionTyping':
                    default:
                        typingManager.addAction(key, update.action)

                        if (chat) {
                            this.updateChat(chat, {
                                isTyping: true,
                            })
                        }
                }

                this.emitFastUpdate(update)
                break
            }
            case 'updateMessageMentionRead': {
                const chat = this.get(update.chat_id)
                if (chat) {
                    this.updateChat(chat, {
                        unread_mention_count: update.unread_mention_count,
                    })

                    //chat.unread_mention_count = update.unread_mention_count;
                }

                this.emitFastUpdate(update)
                break
            }
            default:
                break
        }
    }

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateClearHistory': {
                this.emitUpdate(update)
                break
            }
            case 'clientUpdateLeaveChat': {
                this.emitUpdate(update)
                break
            }
            case 'clientUpdateOpenChat': {
                this.emitUpdate(update)
                break
            }
        }
    }

    emitUpdate = update => {
        this.emit(update['@type'], update)
    }

    emitFastUpdate = update => {
        if (this.updating && TdLibController.parameters.fastUpdating) {
            this.skippedUpdates.push(update)
            return
        }

        this.emit(update['@type'], update)
    }

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate)
        TdLibController.addListener('clientUpdate', this.onClientUpdate)
    }

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate)
        TdLibController.removeListener('clientUpdate', this.onClientUpdate)
    }

    get(chatId) {
        if (!chatId) return null

        return this.reduxStore.getState().chats.get(chatId.toString())
    }

    setOnlineMemberCount(chatId, onlineMemberCount) {
        this.onlineMemberCount.set(chatId, onlineMemberCount)
    }

    getOnlineMemberCount(chatId) {
        return this.onlineMemberCount.get(chatId) || 0
    }

    getTypingManager(chatId) {
        return this.typingManagers.get(chatId)
    }

    setTypingManager(chatId, typingManager) {
        return this.typingManagers.set(chatId, typingManager)
    }
}

const store = new ChatStore()
window.chat = store
export default store
