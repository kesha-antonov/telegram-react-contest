/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { compose } from 'recompose'
import { withTranslation } from 'react-i18next'
import withStyles from '@material-ui/core/styles/withStyles'
import Reply from './Reply'
import Forward from './Forward'
import MessageSendingStatus from './MessageSendingStatus'
import MessageFailedStatus from './MessageFailedStatus'
import MessageAuthor from './MessageAuthor'
import UserTileControl from '../Tile/UserTileControl'
import ChatTileControl from '../Tile/ChatTileControl'
import UnreadSeparator from './UnreadSeparator'
import WebPage from './Media/WebPage'
import {
    getDate,
    getDateHint,
    getText,
    getMedia,
    getUnread,
    getSenderUserId,
    getWebPage,
    openMedia,
} from '../../Utils/Message'
import { canSendMessages } from '../../Utils/Chat'
import { formatNumberToHumanReadable } from '../../Utils/Common'
import { openUser, openChat, selectMessage } from '../../Actions/Client'
import MessageStore from '../../Stores/MessageStore'
import TdLibController from '../../Controllers/TdLibController'
import { EMOJI_WHOLE_STRING_REGEX } from '../../Constants'
import './Message.css'
import emojiRegex from 'emoji-regex/es2015/index.js'
import { connect } from 'react-redux'

const styles = theme => ({
    message: {
        backgroundColor: 'transparent',
    },
    messageAuthorColor: {
        color: theme.palette.primary.main,
    },
    messageSelected: {
        backgroundColor: theme.palette.primary.main + '22',
    },
    '@keyframes highlighted': {
        from: { backgroundColor: theme.palette.primary.main + '22' },
        to: { backgroundColor: 'transparent' },
    },
    messageHighlighted: {
        animation: '$highlighted 4s ease-out',
    },
    textOnlyWithEmojis_1emoji: {
        fontSize: '4em',
        lineHeight: '1em',
        paddingTop: '10px',
    },
    textOnlyWithEmojis_2emoji: {
        fontSize: '3em',
        lineHeight: '1em',
        paddingTop: '10px',
    },
    textOnlyWithEmojis_3emoji: {
        fontSize: '2em',
        lineHeight: '1em',
        paddingTop: '10px',
    },
})

class Message extends Component {
    constructor(props) {
        super(props)

        const { highlighted } = this.props

        if (process.env.NODE_ENV !== 'production') {
            const { chatId, messageId } = this.props
            this.state = {
                message: MessageStore.get(chatId, messageId),
                selected: false,
                highlighted,
            }
        } else {
            this.state = {
                selected: false,
                highlighted,
            }
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {
            theme,
            chatId,
            messageId,
            sendingState,
            showUnreadSeparator,
            withAvatarAndName,
        } = this.props
        const { contextMenu, selected, highlighted } = this.state

        if (nextProps.theme !== theme) {
            return true
        }

        if (nextProps.chatId !== chatId) {
            return true
        }

        if (nextProps.messageId !== messageId) {
            return true
        }

        if (nextProps.sendingState !== sendingState) {
            return true
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            return true
        }

        if (nextProps.withAvatarAndName !== withAvatarAndName) {
            return true
        }

        if (nextState.contextMenu !== contextMenu) {
            return true
        }

        if (nextState.selected !== selected) {
            return true
        }

        if (nextState.highlighted !== highlighted) {
            return true
        }

        return false
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted)
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected)
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection)
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent)
        MessageStore.on('updateMessageEdited', this.onUpdateMessageEdited)
        MessageStore.on('updateMessageViews', this.onUpdateMessageViews)
    }

    componentWillUnmount() {
        MessageStore.removeListener(
            'clientUpdateMessageHighlighted',
            this.onClientUpdateMessageHighlighted
        )
        MessageStore.removeListener(
            'clientUpdateMessageSelected',
            this.onClientUpdateMessageSelected
        )
        MessageStore.removeListener('clientUpdateClearSelection', this.onClientUpdateClearSelection)
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent)
        MessageStore.removeListener('updateMessageEdited', this.onUpdateMessageEdited)
        MessageStore.removeListener('updateMessageViews', this.onUpdateMessageViews)
    }

    onClientUpdateClearSelection = update => {
        if (!this.state.selected) return

        this.setState({ selected: false })
    }

    onClientUpdateMessageHighlighted = update => {
        const { chatId, messageId } = this.props
        const { selected, highlighted } = this.state

        if (selected) return

        if (chatId === update.chatId && messageId === update.messageId) {
            if (highlighted) {
                this.setState({ highlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true })
                    }, 0)
                })
            } else {
                this.setState({ highlighted: true })
            }
        } else if (highlighted) {
            this.setState({ highlighted: false })
        }
    }

    onClientUpdateMessageSelected = update => {
        const { chatId, messageId } = this.props
        const { selected } = update

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ selected, highlighted: false })
        }
    }

    onUpdateMessageEdited = update => {
        const { chat_id, message_id } = update
        const { chatId, messageId } = this.props

        if (chatId === chat_id && messageId === message_id) {
            this.forceUpdate()
        }
    }

    onUpdateMessageViews = update => {
        const { chat_id, message_id } = update
        const { chatId, messageId } = this.props

        if (chatId === chat_id && messageId === message_id) {
            this.forceUpdate()
        }
    }

    onUpdateMessageContent = update => {
        const { chat_id, message_id } = update
        const { chatId, messageId } = this.props

        if (chatId !== chat_id) return
        if (messageId !== message_id) return

        const message = MessageStore.get(chatId, messageId)
        if (!message) return

        const { content } = message
        if (!content) return

        switch (content['@type']) {
            case 'messagePoll': {
                this.forceUpdate()
                break
            }
        }
    }

    handleSelectUser = userId => {
        openUser(userId, true)
    }

    handleSelectChat = chatId => {
        openChat(chatId, null, true)
    }

    handleSelection = () => {
        if (!this.mouseDown) return

        const selection = window.getSelection().toString()
        if (selection) return

        const { chatId, messageId } = this.props

        const selected = !MessageStore.selectedItems.has(`chatId=${chatId}_messageId=${messageId}`)
        // TODO: UPDATE WITH REDUX
        selectMessage(chatId, messageId, selected)
    }

    handleDateClick = e => {
        e.preventDefault()
        e.stopPropagation()

        const { chatId, messageId } = this.props

        const message = MessageStore.get(chatId, messageId)

        const canBeReplied = canSendMessages(chatId)
        if (canBeReplied) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateReply',
                chatId: chatId,
                messageId: messageId,
            })
            return
        }

        const canBeForwarded = message && message.can_be_forwarded
        if (canBeForwarded) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateForward',
                info: {
                    chatId: chatId,
                    messageIds: [messageId],
                },
            })
        }
    }

    openMedia = event => {
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        const { chatId, messageId } = this.props

        openMedia(chatId, messageId)
    }

    handleAnimationEnd = () => {
        this.setState({ highlighted: false })
    }

    handleMouseDown = () => {
        this.mouseDown = true
    }

    handleMouseOver = () => {
        this.mouseDown = false
    }

    handleMouseOut = () => {
        this.mouseOut = false
    }

    render() {
        const { t, classes, chatId, messageId, showUnreadSeparator, withAvatarAndName } = this.props
        const { contextMenu, left, top, selected, highlighted } = this.state

        const message = MessageStore.get(chatId, messageId)
        if (!message) return <div>[empty message]</div>

        const { sending_state, views, edit_date, reply_to_message_id, forward_info } = message

        const text = getText(message)
        let textOnlyWithEmojis = false
        let emojiMatches = 0
        if (message.content && message.content['@type'] === 'messageText') {
            textOnlyWithEmojis = EMOJI_WHOLE_STRING_REGEX.exec(message.content.text.text)
            if (textOnlyWithEmojis) {
                let m
                let re = emojiRegex()
                do {
                    m = re.exec(message.content.text.text)
                    if (m) {
                        emojiMatches += 1
                    }
                } while (m)
            }
        }

        const webPage = getWebPage(message)
        const date = getDate(message)
        const dateHint = getDateHint(message)
        const media = getMedia(message, this.openMedia)
        this.unread = getUnread(message)
        const senderUserId = getSenderUserId(message)

        const tile = senderUserId ? (
            withAvatarAndName ? (
                <UserTileControl userId={senderUserId} onSelect={this.handleSelectUser} />
            ) : null
        ) : (
            <ChatTileControl chatId={chatId} onSelect={this.handleSelectChat} />
        )

        const messageClassName = classNames('message', classes.message, {
            'message-selected': selected,
            'message-without-avatar': !withAvatarAndName,
            [classes.messageSelected]: selected,
            // 'message-highlighted': highlighted && !selected,
            [classes.messageHighlighted]: highlighted && !selected,
        })

        const meta = (
            <div className='message-meta'>
                <span>&nbsp;</span>
                {views > 0 && (
                    <>
                        <span className='message-views'>
                            &nbsp; &nbsp;
                            {formatNumberToHumanReadable(views, true)}
                            &nbsp;
                        </span>
                        <i className='message-views-icon' />
                    </>
                )}
                <MessageSendingStatus chatId={chatId} messageId={messageId} />
                {edit_date > 0 && <span>&nbsp;&nbsp;&nbsp;{t('EditedMessage')}&nbsp;</span>}
                <a className='message-date' onClick={this.handleDateClick}>
                    <span title={dateHint}>{date}</span>
                </a>
            </div>
        )

        return (
            <div
                className={messageClassName}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onMouseDown={this.handleMouseDown}
                onClick={this.handleSelection}
                onAnimationEnd={this.handleAnimationEnd}>
                {showUnreadSeparator && <UnreadSeparator />}
                <div className='message-wrapper'>
                    <i className='message-select-tick' />
                    {this.unread && (
                        <MessageFailedStatus
                            chatId={chatId}
                            messageId={messageId}
                            sendingState={sending_state}
                        />
                    )}
                    {tile}
                    <div className='message-content'>
                        <div className='message-title'>
                            {!forward_info && withAvatarAndName && (
                                <MessageAuthor
                                    chatId={chatId}
                                    openChat
                                    userId={senderUserId}
                                    openUser
                                />
                            )}
                            {forward_info && <Forward forwardInfo={forward_info} />}
                            {withAvatarAndName && meta}
                        </div>
                        <div className='message-content-row'>
                            <div className='message-content-row__left-column'>
                                {Boolean(reply_to_message_id) && (
                                    <Reply chatId={chatId} messageId={reply_to_message_id} />
                                )}
                                {media}
                                <div
                                    className={classNames('message-text', {
                                        [classes.textOnlyWithEmojis_1emoji]:
                                            textOnlyWithEmojis && emojiMatches === 1,
                                        [classes.textOnlyWithEmojis_2emoji]:
                                            textOnlyWithEmojis && emojiMatches === 2,
                                        [classes.textOnlyWithEmojis_3emoji]:
                                            textOnlyWithEmojis && emojiMatches === 3,
                                    })}>
                                    {text}
                                </div>
                                {webPage && (
                                    <WebPage
                                        chatId={chatId}
                                        messageId={messageId}
                                        openMedia={this.openMedia}
                                    />
                                )}
                            </div>
                            {!withAvatarAndName && meta}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

Message.propTypes = {
    withAvatarAndName: PropTypes.bool.isRequired,
    highlighted: PropTypes.bool.isRequired,
}

const mapStateToProps = (state, ownProps) => {
    const highlighted =
        state.currentChat.id !== 0 &&
        state.currentChat.id === ownProps.chatId &&
        state.currentChat.messageId === ownProps.messageId

    return {
        highlighted,
    }
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true }),
    withTranslation(null, { withRef: true })
)

export default enhance(Message)
