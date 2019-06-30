/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { compose } from 'recompose'
import withStyles from '@material-ui/core/styles/withStyles'
import { withTranslation } from 'react-i18next'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import ReplyTile from '../Tile/ReplyTile'
import { accentStyles, borderStyle } from '../Theme'
import { getContent, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message'
import { openChat } from '../../Actions/Client'
import ChatStore from '../../Stores/ChatStore'
import MessageStore from '../../Stores/MessageStore'
import TdLibController from '../../Controllers/TdLibController'
import { connect } from 'react-redux'
import './PinnedMessage.css'

const styles = theme => ({
    ...accentStyles(theme),
    ...borderStyle(theme),
    iconButton: {
        // padding: 4
    },
    pinnedMessage: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary,
    },
})

class PinnedMessage extends React.Component {
    componentDidUpdate(prevProps) {
        const { chat } = this.props

        if (
            chat &&
            chat.pinned_message_id &&
            chat !== prevProps.chat &&
            (!prevProps.chat || chat.pinned_message_id !== prevProps.chat.pinned_message_id)
        ) {
            this.loadContent()
        }
    }

    componentDidMount() {
        this.loadContent()

        ChatStore.on('updateChatPinnedMessage', this.onUpdateChatPinnedMessage)
    }

    componentWillUnmount() {
        ChatStore.removeListener('updateChatPinnedMessage', this.onUpdateChatPinnedMessage)
    }

    onUpdateChatPinnedMessage = update => {
        const { chat_id, pinned_message_id } = update
        const { chat } = this.props

        if (!chat || chat.id !== chat_id) return

        this.loadContent()
    }

    loadContent = () => {
        const { chat } = this.props
        if (!chat) return

        const { pinned_message_id } = chat
        if (!pinned_message_id) return

        const message = MessageStore.get(chat.id, pinned_message_id)
        if (message) return

        TdLibController.send({
            '@type': 'getMessage',
            chat_id: chat.id,
            message_id: pinned_message_id,
        })
            .then(result => {
                MessageStore.set(result)
                this.forceUpdate()
            })
            .catch(error => {
                this.deletePinnedMessage()
            })
    }

    deletePinnedMessage = () => {
        const { chat } = this.props
        if (!chat) return

        const { pinned_message_id } = chat
        if (!pinned_message_id) return

        const deletedMessage = {
            '@type': 'deletedMessage',
            chat_id: chat.id,
            id: pinned_message_id,
            content: null,
        }
        MessageStore.set(deletedMessage)
        this.forceUpdate()
    }

    shouldComponentUpdate(nextProps) {
        const { chat, t, theme } = this.props

        if (nextProps.t !== t) {
            return true
        }

        if (nextProps.theme !== theme) {
            return true
        }

        if (nextProps.chat !== chat) {
            return true
        }

        return false
    }

    handleClick = event => {
        const { chat } = this.props
        if (!chat) return
        if (!chat.pinned_message_id) return

        openChat(chat.id, chat.pinned_message_id)
    }

    handleDelete = event => {
        event.preventDefault()
        event.stopPropagation()

        this.deletePinnedMessage()
    }

    render() {
        const { chat, classes, t } = this.props
        if (!chat) return null

        const { pinned_message_id } = chat
        if (!pinned_message_id) return null

        const message = MessageStore.get(chat.id, pinned_message_id)
        console.log('PinnedMessage.message', chat.id, pinned_message_id, message)
        if (!message) return null

        let content = !message ? t('Loading') : getContent(message, t)
        const photoSize = getReplyPhotoSize(chat.id, pinned_message_id)

        if (isDeletedMessage(message)) {
            content = t('DeletedMessage')
        }

        return (
            <div
                className={classNames('pinned-message', classes.pinnedMessage, classes.borderColor)}
                onClick={this.handleClick}>
                <div className='pinned-message-wrapper'>
                    <div className={classNames('reply-border', classes.accentBackgroundLight)} />
                    {photoSize && (
                        <ReplyTile
                            chatId={chat.id}
                            messageId={pinned_message_id}
                            photoSize={photoSize}
                        />
                    )}
                    <div className='pinned-message-content'>
                        <div className={classNames('reply-content-title', classes.accentColorMain)}>
                            {t('PinnedMessage')}
                        </div>
                        <div className='reply-content-subtitle'>{content}</div>
                    </div>
                    <div className='pinned-message-delete-button'>
                        <IconButton className={classes.iconButton} onClick={this.handleDelete}>
                            <CloseIcon />
                        </IconButton>
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        chat: state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null,
    }
}

PinnedMessage.propTypes = {
    chat: PropTypes.object,
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true }),
    withTranslation()
)

export default enhance(PinnedMessage)
