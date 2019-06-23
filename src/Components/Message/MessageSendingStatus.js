/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import MessageStore from '../../Stores/MessageStore'
import ChatStore from '../../Stores/ChatStore'
import { getUnread } from '../../Utils/Message'
import './MessageSendingStatus.css'
import ScheduleIcon from '@material-ui/icons/Schedule'
import DoneIcon from '@material-ui/icons/Done'
import DoneAllIcon from '@material-ui/icons/DoneAll'
import withStyles from '@material-ui/core/styles/withStyles'
import blue from '@material-ui/core/colors/blue'
import { connect } from 'react-redux'
import { compose } from 'recompose'

const styles = theme => ({
    pending: {
        color: theme.palette.grey[500],
    },
    delivered: {
        color: blue[500],
    },
    read: {
        color: blue[500],
    },
})

function getMessageFromChat(chat, messageId) {
    if (!chat) return null
    if (!chat.last_message) return null
    if (chat.last_message.id !== messageId) return null

    return chat.last_message
}

function getMessageFromProps(props) {
    let message = MessageStore.get(props.chatId, props.messageId)
    if (!message) {
        message = getMessageFromChat(props.chat, props.messageId)
    }

    return message
}

class MessageSendingStatus extends React.Component {
    constructor(props) {
        super(props)

        const message = getMessageFromProps(props)

        this.state = MessageSendingStatus.getNewStateByMessage(message)
    }

    static getDerivedStateFromProps(props, state) {
        const message = getMessageFromProps(props)
        return MessageSendingStatus.getNewStateByMessage(message)
    }

    componentDidMount() {
        MessageStore.on('updateMessageSendFailed', this.handleUpdateMessageSend)
        MessageStore.on('updateMessageSendSucceeded', this.handleUpdateMessageSend)

        ChatStore.on('updateChatReadOutbox', this.handleUpdateChatReadOutbox)
    }

    componentWillUnmount() {
        MessageStore.removeListener('updateMessageSendFailed', this.handleUpdateMessageSend)
        MessageStore.removeListener('updateMessageSendSucceeded', this.handleUpdateMessageSend)

        ChatStore.removeListener('updateChatReadOutbox', this.handleUpdateChatReadOutbox)
    }

    static getNewStateByMessage(message) {
        return {
            sendingState: message ? message.sending_state : null,
            unread: message ? getUnread(message) : false,
            outgoing: message ? message.is_outgoing : false,
            emptyMessage: message == null,
        }
    }

    handleUpdateMessageSend = payload => {
        if (this.props.messageId === payload.old_message_id && payload.message) {
            const { message } = payload

            this.newMessageId = message.id

            this.setState(MessageSendingStatus.getNewStateByMessage(message))
        }
    }

    handleUpdateChatReadOutbox = payload => {
        if (
            this.props.chatId === payload.chat_id &&
            ((this.newMessageId && this.newMessageId <= payload.last_read_outbox_message_id) ||
                this.props.messageId <= payload.last_read_outbox_message_id)
        ) {
            this.setState({ sendingState: null, unread: false })
        }
    }

    render() {
        const { classes, chat, message, iconColor } = this.props
        const { sendingState, unread, outgoing, emptyMessage } = this.state

        if (!chat) return null
        if (!outgoing) return null
        if (emptyMessage) return null

        const style = {
            color: iconColor,
        }

        if (sendingState) {
            if (sendingState['@type'] === 'messageSendingStateFailed') return null

            if (sendingState['@type'] === 'messageSendingStatePending')
                return (
                    <ScheduleIcon
                        className={classNames('message-sending-status-icon', classes.pending)}
                        style={style}
                    />
                )
        }

        if (unread) {
            return (
                <DoneIcon
                    className={classNames('message-sending-status-icon', classes.delivered)}
                    style={style}
                />
            )
        }

        return (
            <DoneAllIcon
                className={classNames('message-sending-status-icon', classes.read)}
                style={style}
            />
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const chat = ownProps.chatId ? state.chats.get(ownProps.chatId.toString()) : null
    let message = chat ? MessageStore.get(chat.id, ownProps.messageId) : null
    if (!message) {
        message = getMessageFromChat(chat, ownProps.messageId)
    }

    return {
        chat,
        message,
    }
}

MessageSendingStatus.propTypes = {
    chatId: PropTypes.number.isRequired,
    chat: PropTypes.object,
    messageId: PropTypes.number.isRequired,
    message: PropTypes.object,
    iconColor: PropTypes.string,
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true })
)

export default enhance(MessageSendingStatus)
