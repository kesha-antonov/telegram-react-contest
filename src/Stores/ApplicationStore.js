/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events'
import TdLibController from '../Controllers/TdLibController'
import ActionScheduler from '../Utils/ActionScheduler'
import {
    setCurrentChat,
    updateCurrentChat,
    clearCurrentChat,
    currentChatReplaceHistory,
    currentChatPrependHistory,
    currentChatAppendHistory,
    currentChatReplaceMessage,
    currentChatDeleteHistory,
    SCROLL_BEHAVIOR_ENUM,
} from './ReduxStore/actions'
import { MESSAGE_SLICE_LIMIT } from '../Constants'
import { getChatFullInfo, getSupergroupId } from '../Utils/Chat'
import MessageStore from './MessageStore'
import FileStore from './FileStore'
import SupergroupStore from './SupergroupStore'
import { loadChatsContent, loadDraftContent, loadMessageContents } from '../Utils/File'
import { filterMessages } from '../Utils/Message'

class ApplicationStore extends EventEmitter {
    constructor() {
        super()

        this.chatId = 0
        this.dialogChatId = 0
        this.messageId = null
        this.statistics = new Map()
        this.scopeNotificationSettings = new Map()
        this.authorizationState = null
        this.connectionState = null
        this.isChatDetailsVisible = false
        this.mediaViewerContent = null
        this.profileMediaViewerContent = null
        this.dragging = false
        this.actionScheduler = new ActionScheduler(
            this.handleScheduledAction,
            this.handleCancelScheduledAction
        )
        this.pendingViewMessagesBatches = []
        this.focused = window.hasFocus

        this.addTdLibListener()
        this.addStatistics()
        this.setMaxListeners(Infinity)
    }

    setReduxStore = reduxStore => {
        this.reduxStore = reduxStore
    }

    addScheduledAction = (key, timeout, action, cancel) => {
        return this.actionScheduler.add(key, timeout, action, cancel)
    }

    invokeScheduledAction = async key => {
        await this.actionScheduler.invoke(key)
    }

    removeScheduledAction = key => {
        this.actionScheduler.remove(key)
    }

    handleScheduledAction = item => {
        console.log('Invoked scheduled action key=', item.key)
    }

    handleCancelScheduledAction = item => {
        console.log('Cancel scheduled action key=', item.key)
    }

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                this.authorizationState = update.authorization_state

                switch (update.authorization_state['@type']) {
                    case 'authorizationStateLoggingOut':
                        this.loggingOut = true
                        break
                    case 'authorizationStateWaitTdlibParameters':
                        TdLibController.sendTdParameters()
                        break
                    case 'authorizationStateWaitEncryptionKey':
                        TdLibController.send({ '@type': 'checkDatabaseEncryptionKey' })
                        break
                    case 'authorizationStateWaitPhoneNumber':
                        break
                    case 'authorizationStateWaitCode':
                        break
                    case 'authorizationStateWaitPassword':
                        break
                    case 'authorizationStateReady':
                        this.loggingOut = false
                        break
                    case 'authorizationStateClosing':
                        break
                    case 'authorizationStateClosed':
                        if (!this.loggingOut) {
                            document.title += ': Zzz…'
                            this.emit('clientUpdateAppInactive')
                        } else {
                            TdLibController.init()
                        }
                        break
                    default:
                        break
                }

                this.emit(update['@type'], update)
                break
            }
            case 'updateConnectionState': {
                this.connectionState = update.state

                this.emit(update['@type'], update)
                break
            }
            case 'updateScopeNotificationSettings': {
                this.setNotificationSettings(update.scope['@type'], update.notification_settings)

                this.emit(update['@type'], update)
                break
            }
            case 'updateFatalError': {
                this.emit(update['@type'], update)

                break
            }
            case 'updateServiceNotification': {
                const { type, content } = update

                if (!content) return
                if (content['@type'] === 'messageText') {
                    const { text } = content
                    if (!text) return

                    if (text['@type'] === 'formattedText' && text.text) {
                        switch (type) {
                            case 'AUTH_KEY_DROP_DUPLICATE':
                                let result = window.confirm(text.text)
                                if (result) {
                                    TdLibController.logOut()
                                }
                                break
                            default:
                                alert(text.text)
                                break
                        }
                    }
                }

                break
            }
            default:
                break
        }
    }

    closeCurrentChat = () => {
        if (this.chatId === 0) return

        TdLibController.send({
            '@type': 'closeChat',
            chat_id: this.chatId,
        })
    }

    setCurrentChat = ({ chatId, messageId }) => {
        this.closeCurrentChat()

        this.chatId = chatId
        this.messageId = messageId
        this.reduxStore.dispatch(setCurrentChat({ messageId, id: chatId }))

        this.openChat()

        if (this.chatId === 0) {
            this.reduxStore && this.reduxStore.dispatch(clearCurrentChat())
        }
    }

    openChat = async () => {
        let state = this.reduxStore.getState()
        const chatId = state.currentChat.id
        if (chatId === 0) return

        const chat = state.chats.get(chatId.toString())

        TdLibController.send({
            '@type': 'openChat',
            chat_id: chatId,
        })

        const { messageId } = this

        const unread = !messageId && chat.unread_count > 0

        const fromMessageId =
            unread && chat.unread_count > 1
                ? chat.last_read_inbox_message_id
                : messageId
                ? messageId
                : 0
        const offset = (unread && chat.unread_count > 1) || messageId ? -1 - MESSAGE_SLICE_LIMIT : 0
        const limit =
            (unread && chat.unread_count > 1) || messageId
                ? 2 * MESSAGE_SLICE_LIMIT
                : MESSAGE_SLICE_LIMIT

        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chat.id,
            from_message_id: fromMessageId,
            offset: offset,
            limit: limit,
        })

        state = this.reduxStore.getState()
        if (state.currentChat.id === 0 || state.currentChat.id !== chat.id) return

        MessageStore.setItems(result.messages)

        const completed = chat.last_message
            ? result.messages.length > 0 && chat.last_message.id === result.messages[0].id
            : true

        // calculate separator
        let separatorMessageId = Number.MAX_VALUE
        if (chat && chat.unread_count > 1) {
            for (let i = result.messages.length - 1; i >= 0; i--) {
                const { id } = result.messages[i]
                if (
                    !result.messages[i].is_outgoing &&
                    id > chat.last_read_inbox_message_id &&
                    id < separatorMessageId
                ) {
                    separatorMessageId = id
                } else {
                    break
                }
            }
        }
        separatorMessageId = separatorMessageId === Number.MAX_VALUE ? 0 : separatorMessageId
        // console.log('[MessagesList] separator_message_id=' + separatorMessageId);

        let scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM
        if (messageId) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_MESSAGE
        } else if (unread && separatorMessageId) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_UNREAD
        }

        const history = result.messages.reverse()

        this.reduxStore.dispatch(
            updateCurrentChat({
                completed,
                history,
                scrollBehavior,
                separatorMessageId,
                suppressHandleScroll: false,
            })
        )

        // load files
        const store = await FileStore.getStore()
        loadMessageContents(store, history)
        loadChatsContent(store, [chatId])
        loadDraftContent(store, chatId)

        this.viewMessages(history)

        this.loadIncompleteHistory(result)

        // load full info
        getChatFullInfo(chatId)
    }

    loadIncompleteHistory = async result => {
        const MAX_ITERATIONS = 5
        let incomplete =
            result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            if (!incomplete) break

            result = await this.onLoadNext()
            incomplete =
                result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT
        }
    }

    scrollToStart = async () => {
        const state = this.reduxStore.getState()
        const chat =
            state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null

        if (!chat) return
        if (this.chatLoading) return

        const chatId = chat.id

        this.chatLoading = false

        if (state.currentChat.completed) {
            this.reduxStore.dispatch(
                updateCurrentChat({
                    completed: false,
                })
            )
        }

        const fromMessageId = 0
        const offset = 0
        const limit = MESSAGE_SLICE_LIMIT

        const sessionId = this.sessionId
        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chat.id,
            from_message_id: fromMessageId,
            offset: offset,
            limit: limit,
        })

        if (sessionId !== this.sessionId) {
            return
        }

        //TODO: replace result with one-way data flow

        state = this.reduxStore.getState()
        if (state.currentChat.id === 0 || state.currentChat.id !== chat.id) return

        const completed = chat.last_message
            ? result.messages.length > 0 && chat.last_message.id === result.messages[0].id
            : true

        MessageStore.setItems(result.messages)
        result.messages.reverse()
        const history = result.messages

        // calculate separator
        let separatorMessageId = 0
        // console.log('[MessagesList] separator_message_id=' + separatorMessageId);

        this.reduxStore.dispatch(
            updateCurrentChat({
                completed,
                history,
                scrollBehavior: SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM,
                separatorMessageId,
                suppressHandleScroll: false,
            })
        )

        // load files
        const store = await FileStore.getStore()
        loadMessageContents(store, result.messages)
        loadChatsContent(store, [chat.id])

        this.viewMessages(result.messages)

        this.loadIncompleteHistory(result)
    }

    onLoadPrevious = async () => {
        let state = this.reduxStore.getState()
        const chat =
            state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null

        if (!chat) return
        if (this.chatLoading) return

        const chatId = chat.id

        if (chat.completed) return

        let fromMessageId = 0
        if (state.currentChat.history && state.currentChat.history.length > 0) {
            fromMessageId = state.currentChat.history[state.currentChat.history.length - 1].id
        }

        this.chatLoading = true

        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chatId,
            from_message_id: fromMessageId,
            offset: -MESSAGE_SLICE_LIMIT - 1,
            limit: MESSAGE_SLICE_LIMIT + 1,
        }).finally(() => {
            this.chatLoading = false
        })

        state = this.reduxStore.getState()
        if (state.currentChat.id === 0 || state.currentChat.id !== chat.id) return

        const completed = chat.last_message
            ? result.messages.length > 0 && chat.last_message.id === result.messages[0].id
            : true

        filterMessages(result, state.currentChat.history)

        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages)
        result.messages.reverse()
        // console.log('SCROLL MessagesList.onLoadPrevious scrollBehavior=NONE');
        const history = this.filterMessages(result.messages)

        this.insertAfter(history, SCROLL_BEHAVIOR_ENUM.NONE)

        const store = await FileStore.getStore()
        loadMessageContents(store, result.messages)
        this.viewMessages(result.messages)

        return result
    }

    insertAfter = (history, scrollBehavior) => {
        this.reduxStore.dispatch(
            currentChatAppendHistory({
                history,
                scrollBehavior,
            })
        )
    }

    onLoadNext = async () => {
        let state = this.reduxStore.getState()
        const chat =
            state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null

        if (!chat) return
        if (this.chatLoading) return

        // TODO: ADD "loading" TO currentChat & GO FURTHER BELOW

        if (this.loadMigratedHistory) {
            this.onLoadMigratedHistory()
            return
        }

        let fromMessageId = 0
        if (state.currentChat.history.length > 0) {
            fromMessageId = state.currentChat.history[0].id
        }

        this.chatLoading = true

        const sessionId = this.sessionId
        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chat.id,
            from_message_id: fromMessageId,
            offset: 0,
            limit: MESSAGE_SLICE_LIMIT,
        }).finally(() => {
            this.chatLoading = false
        })

        state = this.reduxStore.getState()
        if (state.currentChat.id === 0 || state.currentChat.id !== chat.id) return
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages)
        result.messages.reverse()
        this.insertBefore(this.filterMessages(result.messages))

        if (!result.messages.length) {
            this.onLoadMigratedHistory()
        }

        const store = await FileStore.getStore()
        loadMessageContents(store, result.messages)
        this.viewMessages(result.messages)

        return result
    }

    insertBefore = history => {
        this.reduxStore.dispatch(
            currentChatPrependHistory({
                history,
                scrollBehavior: SCROLL_BEHAVIOR_ENUM.KEEP_SCROLL_POSITION,
            })
        )
    }

    filterMessages = messages => {
        return messages.filter(x => x.content['@type'] !== 'messageChatUpgradeTo')
    }

    deleteHistory = messagesIds => {
        let state = this.reduxStore.getState()
        const chat =
            state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null

        if (!chat) return
        if (state.currentChat.history.length === 0) return

        this.reduxStore.dispatch(
            currentChatDeleteHistory({
                messagesIds,
                scrollBehavior: SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM,
            })
        )
    }

    onLoadMigratedHistory = async () => {
        console.log('onLoadMigratedHistory')
        let state = this.reduxStore.getState()
        const chat =
            state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null

        if (!chat) return
        if (this.chatLoading) return

        const supergroupId = getSupergroupId(chat.id)
        if (!supergroupId) return

        const fullInfo = SupergroupStore.getFullInfo(supergroupId)
        if (!fullInfo) return
        if (!fullInfo.upgraded_from_basic_group_id) return

        this.loadMigratedHistory = true

        const basicGroupChat = await TdLibController.send({
            '@type': 'createBasicGroupChat',
            basic_group_id: fullInfo.upgraded_from_basic_group_id,
        })

        if (!basicGroupChat) return

        let fromMessageId = 0
        if (
            state.currentChat.history &&
            state.currentChat.history.length > 0 &&
            state.currentChat.history[0].chat_id === basicGroupChat.id
        ) {
            fromMessageId = state.currentChat.history[0].id
        }

        this.chatLoading = true

        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: basicGroupChat.id,
            from_message_id: fromMessageId,
            offset: 0,
            limit: MESSAGE_SLICE_LIMIT,
        }).finally(() => {
            this.chatLoading = false
        })

        state = this.reduxStore.getState()
        if (state.currentChat.id === 0 || state.currentChat.id !== chat.id) return
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages)
        result.messages.reverse()
        this.insertBefore(this.filterMessages(result.messages))
        const store = await FileStore.getStore()
        loadMessageContents(store, result.messages)
        this.viewMessages(result.messages)
    }

    replaceMessage = (oldMessageId, message, scrollBehavior) => {
        if (!message) return

        this.reduxStore.dispatch(
            currentChatReplaceMessage({
                oldMessageId,
                message,
                scrollBehavior,
            })
        )
    }

    viewMessages = async messages => {
        const hasMessages = messages && messages.length > 0 && messages[0].chat_id
        let payload

        if (hasMessages) {
            payload = {
                chat_id: messages[0].chat_id,
                message_ids: messages.map(x => x.id),
            }
        }

        if (!this.focused) {
            if (hasMessages) this.pendingViewMessagesBatches.push(payload)
            return
        }

        while (this.pendingViewMessagesBatches.length > 0 && this.focused) {
            const payload = this.pendingViewMessagesBatches.shift()
            await TdLibController.send({
                ...payload,
                '@type': 'viewMessages',
            })
        }

        if (!payload) return

        TdLibController.send({
            ...payload,
            '@type': 'viewMessages',
        })
    }

    onClientUpdateFocusWindow = update => {
        const { focused } = update

        if (focused === this.focused) return
        this.focused = update.focused

        this.viewMessages()
    }

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateChatId': {
                const extendedUpdate = {
                    '@type': 'clientUpdateChatId',
                    nextChatId: update.chatId,
                    nextMessageId: update.messageId,
                    previousChatId: this.chatId,
                    previousMessageId: this.messageId,
                }

                this.setCurrentChat({
                    messageId: update.messageId,
                    chatId: update.chatId,
                })

                this.emit('clientUpdateChatId', extendedUpdate)
                break
            }
            case 'clientUpdateDialogChatId': {
                const { chatId } = update
                this.dialogChatId = chatId

                this.emit('clientUpdateDialogChatId', update)
                break
            }
            case 'clientUpdateFocusWindow': {
                TdLibController.send({
                    '@type': 'setOption',
                    name: 'online',
                    value: { '@type': 'optionValueBoolean', value: update.focused },
                })

                this.onClientUpdateFocusWindow(update)

                this.emit('clientUpdateFocusWindow', update)
                break
            }
            case 'clientUpdateForward': {
                this.emit('clientUpdateForward', update)
                break
            }
            case 'clientUpdateLeaveChat': {
                if (update.inProgress && this.chatId === update.chatId) {
                    TdLibController.setChatId(0)
                }

                break
            }
        }
    }

    onUpdateStatistics = update => {
        if (!update) return

        if (this.statistics.has(update['@type'])) {
            const count = this.statistics.get(update['@type'])

            this.statistics.set(update['@type'], count + 1)
        } else {
            this.statistics.set(update['@type'], 1)
        }
    }

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate)
        TdLibController.addListener('clientUpdate', this.onClientUpdate)
    }

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate)
        TdLibController.removeListener('clientUpdate', this.onClientUpdate)
    }

    addStatistics = () => {
        TdLibController.addListener('update', this.onUpdateStatistics)
    }

    setChatId = (chatId, messageId = null) => {
        if (chatId === this.chatId) return

        const update = {
            '@type': 'clientUpdateChatId',
            nextChatId: chatId,
            nextMessageId: messageId,
            previousChatId: this.chatId,
            previousMessageId: this.messageId,
        }

        this.setCurrentChat({ chatId, messageId })

        this.emit(update['@type'], update)
    }

    getChatId() {
        return this.chatId
    }

    getMessageId() {
        return this.messageId
    }

    searchChat(chatId) {
        this.emit('clientUpdateSearchChat', { chatId: chatId })
    }

    changeChatDetailsVisibility(visibility) {
        this.isChatDetailsVisible = visibility
        this.emit('clientUpdateChatDetailsVisibility', visibility)
    }

    setMediaViewerContent(content) {
        this.mediaViewerContent = content
        this.emit('clientUpdateMediaViewerContent', content)
    }

    setProfileMediaViewerContent(content) {
        this.profileMediaViewerContent = content
        this.emit('clientUpdateProfileMediaViewerContent', content)
    }

    getConnectionState() {
        return this.connectionState
    }

    getAuthorizationState() {
        return this.authorizationState
    }

    getNotificationSettings(scope) {
        return this.scopeNotificationSettings.get(scope)
    }

    setNotificationSettings(scope, notificationSettings) {
        return this.scopeNotificationSettings.set(scope, notificationSettings)
    }

    getDragging = () => {
        return this.dragging
    }

    setDragging = value => {
        this.dragging = value
        this.emit('clientUpdateDragging', value)
    }
}

const store = new ApplicationStore()
window.application = store
export default store
