/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom'
import withStyles from '@material-ui/core/styles/withStyles'
import classNames from 'classnames'
import FilesDropTarget from './FilesDropTarget'
import Message from '../Message/Message'
import PinnedMessage from './PinnedMessage'
import ServiceMessage from '../Message/ServiceMessage'
import StickersHint from './StickersHint'
import { throttle, getPhotoSize, itemsInView } from '../../Utils/Common'
import { loadMessageContents } from '../../Utils/File'
import { isServiceMessage } from '../../Utils/ServiceMessage'
import {
    canSendFiles,
    getChatFullInfo,
    getMessageDateWithMonth,
    isMeChat,
    isChannelChat,
} from '../../Utils/Chat'
import { highlightMessage } from '../../Actions/Client'
import ChatStore from '../../Stores/ChatStore'
import MessageStore from '../../Stores/MessageStore'
import FileStore from '../../Stores/FileStore'
import ApplicationStore from '../../Stores/ApplicationStore'
import PlayerStore from '../../Stores/PlayerStore'
import TdLibController from '../../Controllers/TdLibController'
import './MessagesList.css'
import ChatTextPlaceholder from './ChatTextPlaceholder'
import Scrollbar from '../Scrollbar'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withTranslation } from 'react-i18next'
import {
    currentChatClearScrollBehavior,
    updateCurrentChat,
    SCROLL_BEHAVIOR_ENUM,
} from '../../Stores/ReduxStore/actions'

const styles = theme => ({
    background: {
        background: theme.palette.type === 'dark' ? theme.palette.grey[900] : 'transparent',
    },
    messagesDate: {
        color: theme.palette.grey[500],
    },
})

class MessagesList extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            playerOpened: false,
        }

        this.listRef = null
        this.itemsRef = React.createRef()

        this.itemsMap = new Map()

        this.updateItemsInView = throttle(this.updateItemsInView, 500)
    }

    componentDidMount() {
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage)
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages)
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent)
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded)
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateSelection)
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateSelection)
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage)
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory)

        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive)
        PlayerStore.on('clientUpdateMediaEnding', this.onClientUpdateMediaEnding)
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd)
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {
            t,
            theme,
            messageId,
            history,
            clearHistory,
            selectionActive,
            completed,
        } = this.props
        const { playerOpened } = this.state

        if (nextProps.t !== t) {
            return true
        }

        if (nextProps.theme !== theme) {
            return true
        }

        if (nextProps.messageId !== messageId) {
            return true
        }

        if (nextProps.history !== history) {
            return true
        }

        if (nextProps.clearHistory !== clearHistory) {
            return true
        }

        if (nextProps.selectionActive !== selectionActive) {
            return true
        }

        if (nextProps.completed !== completed) {
            return true
        }

        if (nextState.playerOpened !== playerOpened) {
            return true
        }

        if (
            nextProps.scrollBehavior !== this.props.scrollBehavior &&
            nextProps.crollBehavior !== SCROLL_BEHAVIOR_ENUM.NONE
        ) {
            return true
        }

        return false
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chat, messageId } = this.props

        if (this.props.scrollBehavior !== prevProps.scrollBehavior) {
            this.handleScrollBehavior(snapshot)
        }

        if (chat && messageId !== 0 && messageId !== prevProps.messageId) {
            console.log('highlightMessage', messageId, prevProps.messageId, this.props.history)
            highlightMessage(chat.id, messageId)
        }
    }

    componentWillUnmount() {
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage)
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages)
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent)
        MessageStore.removeListener('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded)
        MessageStore.removeListener('clientUpdateMessageSelected', this.onClientUpdateSelection)
        MessageStore.removeListener('clientUpdateClearSelection', this.onClientUpdateSelection)
        ChatStore.removeListener('updateChatLastMessage', this.onUpdateChatLastMessage)
        ChatStore.removeListener('clientUpdateClearHistory', this.onClientUpdateClearHistory)

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive)
        PlayerStore.removeListener('clientUpdateMediaEnding', this.onClientUpdateMediaEnding)
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd)
    }

    getSnapshotBeforeUpdate() {
        const { scrollTop, scrollHeight, offsetHeight } = this.listRef

        const snapshot = {
            scrollTop,
            scrollHeight,
            offsetHeight,
        }

        return snapshot
    }

    onClientUpdateMediaActive = update => {
        if (this.state.playerOpened) return

        const list = this.listRef

        const prevOffsetHeight = list.offsetHeight
        const prevScrollTop = list.scrollTop
        this.setState({ playerOpened: true }, () => {
            if (list.scrollTop === prevScrollTop) {
                list.scrollTop += Math.abs(prevOffsetHeight - list.offsetHeight)
            }
        })
    }

    onClientUpdateMediaEnding = udpate => {
        const list = this.listRef

        this.prevOffsetHeight = list.offsetHeight
        this.prevScrollTop = list.scrollTop
    }

    onClientUpdateMediaEnd = udpate => {
        const list = this.listRef

        //const prevOffsetHeight = list.offsetHeight;
        //const prevScrollTop = list.scrollTop;

        this.setState({ playerOpened: false }, () => {
            if (list.scrollTop === this.prevScrollTop) {
                list.scrollTop -= Math.abs(this.prevOffsetHeight - list.offsetHeight)
            }
        })
    }

    onClientUpdateSelection = update => {
        if (!this.props.isChatSelected) return

        this.props.dispatch(
            updateCurrentChat({
                selectionActive: MessageStore.selectedItems.size > 0,
                scrollBehavior: SCROLL_BEHAVIOR_ENUM.KEEP_SCROLL_POSITION,
            })
        )
    }

    onClientUpdateClearHistory = update => {
        if (!this.props.isChatSelected) return

        this.props.dispatch(
            updateCurrentChat({
                clearHistory: update.inProgress,
            })
        )
    }

    onUpdateMessageContent = async update => {
        const { chat, history } = this.props
        const { chat_id, message_id } = update

        if (!chat) return
        if (chat.id !== chat_id) return

        if (history.findIndex(x => x.id === message_id) !== -1) {
            const message = MessageStore.get(chat_id, message_id)
            if (!message) return

            const store = await FileStore.getStore()
            loadMessageContents(store, [message])
        }
    }

    onUpdateChatLastMessage = update => {
        const { chat } = this.props

        if (!chat) return
        if (chat.id !== update.chat_id) return
        // TODO?
    }

    onUpdateMessageSendSucceeded = async update => {
        const { message, old_message_id } = update
        const { chat } = this.props

        if (!chat) return
        if (chat.id !== message.chat_id) return

        let handleSendSucceeded = false
        const { content } = message
        switch (content['@type']) {
            case 'messagePoll': {
                handleSendSucceeded = true
                break
            }
        }

        if (!handleSendSucceeded) return

        let scrollBehavior = SCROLL_BEHAVIOR_ENUM.NONE
        const list = this.listRef
        // at the end of list
        if (list.scrollTop === list.scrollHeight - list.offsetHeight) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM
        }
        // sent message
        else if (message.is_outgoing) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM
        }

        // console.log('SCROLL MessagesList.onUpdateMessageSendSucceeded scrollBehavior=' + scrollBehavior);

        ApplicationStore.replaceMessage(old_message_id, message, scrollBehavior)

        const store = await FileStore.getStore()
        loadMessageContents(store, [message])
        ApplicationStore.viewMessages([message])
    }

    onUpdateNewMessage = async update => {
        if (!this.props.completed) return

        const { message } = update
        const { chat } = this.props

        if (!chat) return
        if (chat.id !== message.chat_id) return

        let scrollBehavior = SCROLL_BEHAVIOR_ENUM.NONE
        const list = this.listRef
        // at the end of list
        if (list.scrollTop === list.scrollHeight - list.offsetHeight) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM
        }
        // sent message
        else if (message.is_outgoing) {
            scrollBehavior = SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM
        }

        const history = [message]

        // console.log('SCROLL MessagesList.onUpdateNewMessage scrollBehavior=' + scrollBehavior)
        ApplicationStore.insertAfter(ApplicationStore.filterMessages(history), scrollBehavior)
        const store = await FileStore.getStore()
        loadMessageContents(store, history)
        ApplicationStore.viewMessages(history)
    }

    onUpdateDeleteMessages = update => {
        const { chat } = this.props

        if (!chat) return
        if (chat.id !== update.chat_id) return

        if (!update.is_permanent) return

        ApplicationStore.deleteHistory(update.message_ids)
    }

    updateItemsInView = async () => {
        if (!this.messages) return

        const messages = new Map()
        const items = itemsInView(this.listRef, this.itemsRef)
        for (let i = 0; i < items.length; i++) {
            const message = this.messages[items[i]]
            if (message) {
                const { chat, messageId } = message.props
                const key = `${chat && chat.id}_${messageId}`
                messages.set(key, key)
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMessagesInView',
            messages,
        })
        return

        if (!messages.length) return

        /*let ids = messages.map(x => x.id);
        console.log('[perf] load_messages_contents ids=[' + ids + ']');

                let messagesMap = new Map(messages.map((i) => [i.id, i]));

                if (this.previousMessages){
                    let cancelMessages = [];
                    for (let i = 0; i < this.previousMessages.length; i++){
                        if (!messagesMap.has(this.previousMessages[i].id)){
                            cancelMessages.push(this.previousMessages[i]);
                        }
                    }
                    if (cancelMessages.length > 0) {
                        this.cancelLoadMessageContents(cancelMessages);
                    }
                }
                this.previousMessages = messages;*/

        const store = await FileStore.getStore()
        loadMessageContents(store, messages)
    }

    cancelLoadMessageContents(messages) {
        //return;
        for (let i = messages.length - 1; i >= 0; i--) {
            let message = messages[i]
            if (message && message.content) {
                switch (message.content['@type']) {
                    case 'messagePhoto': {
                        let [id, pid] = this.getMessagePhoto(message)
                        if (pid) {
                            let obj = getPhotoSize(message.content.photo.sizes)
                            if (!obj.blob) {
                                FileStore.cancelGetRemoteFile(id, message)
                            }
                        }
                        break
                    }
                    case 'messageSticker': {
                        let [id, pid] = this.getMessageSticker(message)
                        if (pid) {
                            let obj = message.content.sticker.sticker
                            if (!obj.blob) {
                                FileStore.cancelGetRemoteFile(id, message)
                            }
                        }
                        break
                    }
                    default:
                        break
                }
            }
        }
    }

    handleScroll = () => {
        if (!this.props.isChatSelected) return
        console.log('SCROLL HANDLESCROLL')

        this.updateItemsInView()

        const list = this.listRef
        // console.log(`SCROLL HANDLESCROLL list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${this.props.chatId}`);

        if (this.suppressHandleScroll) {
            // console.log('SCROLL HANDLESCROLL suppressHandleScroll');
            this.suppressHandleScroll = false
            return
        }

        if (this.props.suppressHandleScroll) {
            // console.log('SCROLL HANDLESCROLL suppressHandleScrollOnSelectChat');
            return
        }

        if (list.scrollTop <= 0) {
            // console.log('SCROLL HANDLESCROLL onLoadNext');
            ApplicationStore.onLoadNext()
        } else if (list.scrollTop + list.offsetHeight === list.scrollHeight) {
            // console.log('SCROLL HANDLESCROLL onLoadPrevious');
            ApplicationStore.onLoadPrevious()
        } else {
            // console.log('SCROLL HANDLESCROLL updateItemsInView');
        }
    }

    handleScrollBehavior = snapshot => {
        const { chat, messageId, scrollBehavior, history } = this.props
        const { scrollTop, scrollHeight, offsetHeight } = snapshot

        // console.log(
        //     `SCROLL HANDLESCROLLBEHAVIOR \\
        //     scrollBehavior=${scrollBehavior} \\
        //     previousScrollTop=${scrollTop} \\
        //     previousScrollHeight=${scrollHeight} \\
        //     previousOffsetHeight=${offsetHeight} \\
        //     chatId=${chatId}`
        // );
        if (scrollBehavior === SCROLL_BEHAVIOR_ENUM.NONE) {
        } else if (scrollBehavior === SCROLL_BEHAVIOR_ENUM.SCROLL_TO_BOTTOM) {
            this.scrollToBottom()
        } else if (scrollBehavior === SCROLL_BEHAVIOR_ENUM.SCROLL_TO_MESSAGE) {
            this.scrollToMessage()
        } else if (scrollBehavior === SCROLL_BEHAVIOR_ENUM.SCROLL_TO_UNREAD) {
            const list = this.listRef
            // console.log(
            //     `SCROLL SCROLL_TO_UNREAD before \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     chatId=${chatId}`
            // );

            let scrolled = false
            const isChatHasPinnedMessage =
                chat && chat.pinned_message_id && MessageStore.get(chat.id, chat.pinned_message_id)
            for (let i = 0; i < history.length; i++) {
                let itemComponent = this.itemsMap.get(i)
                let item = ReactDOM.findDOMNode(itemComponent)
                if (item) {
                    // console.log(`SCROLL SCROLL_TO_UNREAD \\
                    //     item item.scrollTop=${item.scrollTop} \\
                    //     showUnreadSeparator=${itemComponent.props.showUnreadSeparator} \\
                    //     item.offsetHeight=${item.offsetHeight} \\
                    //     item.scrollHeight=${item.scrollHeight}`);
                    if (itemComponent.props.showUnreadSeparator) {
                        list.scrollTop = item.offsetTop - (isChatHasPinnedMessage ? 60 : 0)
                        scrolled = true
                        break
                    }
                }
            }

            if (!scrolled) {
                this.scrollToBottom()
            }

            // console.log(
            //     `SCROLL SCROLL_TO_UNREAD after \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     chatId=${chatId}`
            // );
        } else if (scrollBehavior === SCROLL_BEHAVIOR_ENUM.KEEP_SCROLL_POSITION) {
            const list = this.listRef
            // console.log(
            //     `SCROLL KEEP_SCROLL_POSITION before \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     chatId=${chatId}`
            // );
            list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight)
            // console.log(
            //     `SCROLL KEEP_SCROLL_POSITION after \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     chatId=${chatId}`
            // );
        }

        if (scrollBehavior !== SCROLL_BEHAVIOR_ENUM.NONE)
            this.props.dispatch(currentChatClearScrollBehavior())
    }

    scrollToMessage = () => {
        const { chat, history, messageId } = this.props

        if (!chat) return

        const list = this.listRef
        // console.log(
        //     `SCROLL SCROLL_TO_MESSAGE message_id=${messageId} before \\
        //     list.scrollTop=${list.scrollTop} \\
        //     list.offsetHeight=${list.offsetHeight} \\
        //     list.scrollHeight=${list.scrollHeight} \\
        //     chatId=${chatId}`
        // );

        let scrolled = false
        for (let i = 0; i < history.length; i++) {
            let itemComponent = this.itemsMap.get(i)
            let item = ReactDOM.findDOMNode(itemComponent)
            if (item) {
                // console.log(`SCROLL SCROLL_TO_MESSAGE message_id=${messageId} \\
                //     item item.scrollTop=${item.scrollTop} \\
                //     showUnreadSeparator=${itemComponent.props.showUnreadSeparator} \\
                //     item.offsetHeight=${item.offsetHeight} \\
                //     item.scrollHeight=${item.scrollHeight}`);
                if (itemComponent.props.messageId === messageId) {
                    list.scrollTop = item.offsetTop - list.offsetHeight / 2.0
                    scrolled = true
                    break
                }
            }
        }

        if (!scrolled) {
            this.scrollToBottom()
        }

        // console.log(
        //     `SCROLL SCROLL_TO_MESSAGE message_id=${messageId} after \\
        //     list.scrollTop=${list.scrollTop} \\
        //     list.offsetHeight=${list.offsetHeight} \\
        //     list.scrollHeight=${list.scrollHeight} \\
        //     chatId=${chatId}`
        // );
    }

    scrollToBottom = () => {
        this.suppressHandleScroll = true
        const list = this.listRef
        // console.log(
        //     `SCROLL SCROLL_TO_BOTTOM before \\
        //     list.scrollHeight=${list.scrollHeight} \\
        //     list.offsetHeight=${list.offsetHeight} \\
        //     list.scrollTop=${list.scrollTop} \\
        //     chatId=${this.props.chatId}`
        // );

        const nextScrollTop = list.scrollHeight - list.offsetHeight
        if (nextScrollTop !== list.scrollTop) {
            list.scrollTop = list.scrollHeight - list.offsetHeight
            // console.log(
            //     `SCROLL SCROLL_TO_BOTTOM after \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     suppressHandleScroll=${this.suppressHandleScroll} \\
            //     chatId=${this.props.chatId}`
            // );
        } else {
            // console.log(
            //     `SCROLL SCROLL_TO_BOTTOM after(already bottom) \\
            //     list.scrollTop=${list.scrollTop} \\
            //     list.offsetHeight=${list.offsetHeight} \\
            //     list.scrollHeight=${list.scrollHeight} \\
            //     suppressHandleScroll=${this.suppressHandleScroll} \\
            //     chatId=${this.props.chatId}`
            // );
        }
    }

    scrollToStart = async () => {
        ApplicationStore.scrollToStart()
    }

    handleListDragEnter = event => {
        event.preventDefault()
        event.stopPropagation()

        const { chat } = this.props

        if (!chat) return
        if (!canSendFiles(chat.id)) return

        ApplicationStore.setDragging(true)
    }

    onListRef = listRef => {
        this.listRef = listRef
    }

    render() {
        const {
            classes,
            isChatSelected,
            chat,
            t,
            history,
            clearHistory,
            selectionActive,
            separatorMessageId,
            completed,
        } = this.props

        console.log(`MessagesList.render clearHistory=${clearHistory}`, history.length)

        this.itemsMap.clear()
        const _isMeChat = isMeChat(chat)
        const _isChannelChat = isChannelChat(chat)

        this.messages = clearHistory
            ? null
            : history.map((x, i) => {
                  let withDate = i === 0 && completed
                  const prevMessage = history[i - 1]
                  if (!withDate && i > 0) {
                      let prevMessageDate = new Date(prevMessage.date * 1000)
                      let messageDate = new Date(x.date * 1000)

                      withDate = prevMessageDate.getDate() !== messageDate.getDate()
                  }

                  const _isServiceMessage = isServiceMessage(x)
                  const withAvatarAndName =
                      i === 0 ||
                      _isServiceMessage ||
                      _isMeChat ||
                      _isChannelChat ||
                      x.reply_to_message_id !== 0 ||
                      !!x.forward_info ||
                      isServiceMessage(prevMessage) ||
                      x.sender_user_id !== prevMessage.sender_user_id ||
                      x.date - prevMessage.date > 600

                  return (
                      <div key={`chat_id=${x.chat_id} message_id=${x.id}`}>
                          {withDate && (
                              <div className={classNames('messages-date', classes.messagesDate)}>
                                  {getMessageDateWithMonth(x, t)}
                              </div>
                          )}
                          {_isServiceMessage ? (
                              <ServiceMessage
                                  ref={el => this.itemsMap.set(i, el)}
                                  chatId={x.chat_id}
                                  messageId={x.id}
                                  showUnreadSeparator={separatorMessageId === x.id}
                              />
                          ) : (
                              <Message
                                  innerRef={el => this.itemsMap.set(i, el)}
                                  chatId={x.chat_id}
                                  messageId={x.id}
                                  showTitle
                                  sendingState={x.sending_state}
                                  showUnreadSeparator={separatorMessageId === x.id}
                                  withAvatarAndName={withAvatarAndName}
                              />
                          )}
                      </div>
                  )
              })

        return (
            <div
                className={classNames(classes.background, 'messages-list', {
                    'messages-list-selection-active': selectionActive,
                })}
                onDragEnter={this.handleListDragEnter}>
                <Scrollbar
                    containerRef={this.onListRef}
                    className='messages-list-wrapper'
                    onScrollY={this.handleScroll}>
                    {isChatSelected ? (
                        completed && (!this.messages || this.messages.length === 0) ? (
                            <ChatTextPlaceholder text={t('ChatNoMessages')} />
                        ) : (
                            <>
                                <div className='messages-list-top' />
                                <div ref={this.itemsRef} className='messages-list-items'>
                                    {this.messages}
                                </div>
                            </>
                        )
                    ) : (
                        <ChatTextPlaceholder text={t('SelectChatPlaceholder')} />
                    )}
                </Scrollbar>
                <PinnedMessage />
                <FilesDropTarget />
                <StickersHint />
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const isChatSelected = state.currentChat.id !== 0

    return {
        chat: isChatSelected ? state.chats.get(state.currentChat.id.toString()) : null,
        isChatSelected,
        scrollBehavior: state.currentChat.scrollBehavior,
        history: state.currentChat.history,
        messageId: state.currentChat.messageId,
        clearHistory: state.currentChat.clearHistory,
        selectionActive: state.currentChat.selectionActive,
        separatorMessageId: state.currentChat.separatorMessageId,
        completed: state.currentChat.completed,
        suppressHandleScroll: state.currentChat.suppressHandleScroll,
    }
}

MessagesList.propTypes = {
    chat: PropTypes.object,
    isChatSelected: PropTypes.bool.isRequired,
    scrollBehavior: PropTypes.string.isRequired,
    clearHistory: PropTypes.bool.isRequired,
    selectionActive: PropTypes.bool.isRequired,
    separatorMessageId: PropTypes.number.isRequired,
    completed: PropTypes.bool.isRequired,
    suppressHandleScroll: PropTypes.bool.isRequired,
}

const enhance = compose(
    connect(mapStateToProps),
    withTranslation(),
    withStyles(styles, { withTheme: true })
)

export default enhance(MessagesList)
