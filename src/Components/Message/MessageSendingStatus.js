/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
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

// .message-sending-status-read {
//     background: #4eabf1;
// }
//
// .message-sending-status-delivered {
//     background: #4eabf1;
// }
//
// .message-sending-status-pending {
//     background: #4eabf1;
// }

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

class MessageSendingStatus extends React.Component {
    constructor(props) {
        super(props)
        this.handleUpdateMessageSend = this.handleUpdateMessageSend.bind(this)
        this.handleUpdateChatReadOutbox = this.handleUpdateChatReadOutbox.bind(this)

        const message = MessageStore.get(props.chatId, props.messageId)

        this.outgoing = message.is_outgoing
        console.log('message', message, this.outgoing)

        this.state = {
            sendingState: message.sending_state,
            unread: getUnread(message),
        }
    }

    componentDidMount() {
        if (!this.outgoing) return

        MessageStore.on('updateMessageSendFailed', this.handleUpdateMessageSend)
        MessageStore.on('updateMessageSendSucceeded', this.handleUpdateMessageSend)

        ChatStore.on('updateChatReadOutbox', this.handleUpdateChatReadOutbox)
    }

    handleUpdateMessageSend(payload) {
        if (this.props.messageId === payload.old_message_id && payload.message) {
            this.newMessageId = payload.message.id
            this.setState({ sendingState: payload.message.sending_state })
        }
    }

    handleUpdateChatReadOutbox(payload) {
        if (
            this.props.chatId === payload.chat_id &&
            ((this.props.newMessageId &&
                this.props.newMessageId <= payload.last_read_outbox_message_id) ||
                this.props.messageId <= payload.last_read_outbox_message_id)
        ) {
            this.setState({ sendingState: null, unread: false })
        }
    }

    componentWillUnmount() {
        if (!this.outgoing) return

        MessageStore.removeListener('updateMessageSendFailed', this.handleUpdateMessageSend)
        MessageStore.removeListener('updateMessageSendSucceeded', this.handleUpdateMessageSend)

        ChatStore.removeListener('updateChatReadOutbox', this.handleUpdateChatReadOutbox)
    }

    render() {
        if (!this.outgoing) return null

        const { classes } = this.props
        const { sendingState, unread } = this.state

        if (sendingState) {
            if (sendingState['@type'] === 'messageSendingStateFailed') return null

            if (sendingState['@type'] === 'messageSendingStatePending')
                return (
                    <ScheduleIcon
                        className={classNames('message-sending-status-icon', classes.pending)}
                    />
                )
        }

        if (unread) {
            return (
                <DoneIcon
                    className={classNames('message-sending-status-icon', classes.delivered)}
                />
            )
        }

        return <DoneAllIcon className={classNames('message-sending-status-icon', classes.read)} />
    }
}

export default withStyles(styles, { withTheme: true })(MessageSendingStatus)
