/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import withStyles from '@material-ui/core/styles/withStyles'
import {
    getChatUnreadCount,
    getChatUnreadMentionCount,
    getChatUnreadMessageIcon,
    isChatMuted,
} from '../../Utils/Chat'
import ApplicationStore from '../../Stores/ApplicationStore'
import ChatStore from '../../Stores/ChatStore'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import './DialogBadgeControl.css'

const styles = theme => ({
    dialogBadge: {
        background: theme.palette.primary.main,
    },
    dialogBadgeMuted: {
        background: theme.palette.type === 'dark' ? theme.palette.text.disabled : '#d8d8d8',
    },
})

class DialogBadgeControl extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { chat, theme } = this.props

        if (nextProps.chat !== chat) {
            return true
        }

        if (nextProps.theme !== theme) {
            return true
        }

        return false
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete)
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory)
        ChatStore.on('updateChatDraftMessage', this.onUpdate)
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate)
        ChatStore.on('updateChatIsPinned', this.onUpdate)
        ChatStore.on('updateChatNotificationSettings', this.onUpdate)
        ChatStore.on('updateChatReadInbox', this.onUpdate)
        ChatStore.on('updateChatReadOutbox', this.onUpdate)
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate)
        ApplicationStore.on(
            'updateScopeNotificationSettings',
            this.onUpdateScopeNotificationSettings
        )
    }

    componentWillUnmount() {
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete)
        ChatStore.removeListener('clientUpdateClearHistory', this.onClientUpdateClearHistory)
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate)
        ChatStore.removeListener('updateChatIsMarkedAsUnread', this.onUpdate)
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate)
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdate)
        ChatStore.removeListener('updateChatReadInbox', this.onUpdate)
        ChatStore.removeListener('updateChatReadOutbox', this.onUpdate)
        ChatStore.removeListener('updateChatUnreadMentionCount', this.onUpdate)
        ApplicationStore.removeListener(
            'updateScopeNotificationSettings',
            this.onUpdateScopeNotificationSettings
        )
    }

    onClientUpdateClearHistory = update => {
        const { chat } = this.props

        if (chat && chat.id === update.chatId) {
            this.clearHistory = update.inProgress
            this.forceUpdate()
        }
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate()
    }

    onUpdate = update => {
        const { chat } = this.props

        if (chat && chat.id === update.chatId) {
            this.forceUpdate()
        }
    }

    onUpdateScopeNotificationSettings = update => {
        const { chat } = this.props

        if (!chat) return

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (
                    chat.type['@type'] === 'chatTypeBasicGroup' ||
                    chat.type['@type'] === 'chatTypeSupergroup'
                ) {
                    this.forceUpdate()
                }
                break
            }
            case 'notificationSettingsScopePrivateChats': {
                if (
                    chat.type['@type'] === 'chatTypePrivate' ||
                    chat.type['@type'] === 'chatTypeSecret'
                ) {
                    this.forceUpdate()
                }
                break
            }
        }
    }

    render() {
        if (this.clearHistory) return null

        const { classes, chat } = this.props

        if (!chat) return null

        const unreadMessageIcon = getChatUnreadMessageIcon(chat)
        const unreadCount = getChatUnreadCount(chat)
        const unreadMentionCount = getChatUnreadMentionCount(chat)
        const showUnreadCount = unreadCount > 1 || (unreadCount === 1 && unreadMentionCount < 1)

        return (
            <>
                {unreadMentionCount && (
                    <div className={classNames('dialog-badge', classes.dialogBadge)}>
                        <div className='dialog-badge-mention'>@</div>
                    </div>
                )}
                {showUnreadCount ? (
                    <div
                        className={classNames(
                            { [classes.dialogBadgeMuted]: isChatMuted(chat) },
                            'dialog-badge',
                            classes.dialogBadge
                        )}>
                        <span className='dialog-badge-text'>{unreadCount}</span>
                    </div>
                ) : chat.is_pinned && !unreadMessageIcon ? (
                    <i className='dialog-badge-pinned' />
                ) : null}
            </>
        )
    }
}

DialogBadgeControl.propTypes = {
    chat: PropTypes.object.isRequired,
    chatId: PropTypes.number.isRequired,
    theme: PropTypes.object.isRequired,
}

const mapStateToProps = (state, ownProps) => {
    return {
        chat: state.chats.get(ownProps.chatId.toString()),
    }
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true })
)

export default enhance(DialogBadgeControl)
