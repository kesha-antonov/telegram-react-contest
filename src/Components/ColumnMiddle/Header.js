/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import IconButton from '@material-ui/core/IconButton'
import SearchIcon from '@material-ui/icons/Search'
import withStyles from '@material-ui/core/styles/withStyles'
import { withTranslation } from 'react-i18next'
import { compose } from 'recompose'
import MainMenuButton from './MainMenuButton'
import HeaderCommand from './HeaderCommand'
import {
    getChatSubtitle,
    getChatTitle,
    isAccentChatSubtitle,
    isVerifiedChat,
} from '../../Utils/Chat'
import { borderStyle } from '../Theme'
import ChatStore from '../../Stores/ChatStore'
import UserStore from '../../Stores/UserStore'
import BasicGroupStore from '../../Stores/BasicGroupStore'
import SupergroupStore from '../../Stores/SupergroupStore'
import MessageStore from '../../Stores/MessageStore'
import ApplicationStore from '../../Stores/ApplicationStore'
import './Header.css'
import { connect } from 'react-redux'
import VerifiedBadgeIcon from '../Icons/VerifiedBadgeIcon'

const styles = theme => ({
    button: {
        margin: '14px',
    },
    menuIconButton: {
        margin: '8px -2px 8px 12px',
    },
    searchIconButton: {
        margin: '8px 12px 8px 0',
    },
    messageSearchIconButton: {
        margin: '8px 0 8px 12px',
    },
    moreIconButton: {
        margin: '8px 12px 8px 0',
    },
    headerStatusAccentTitle: {
        color: theme.palette.primary.dark + '!important',
    },
    ...borderStyle(theme),
    titleIcon: {
        marginLeft: 8,
        marginBottom: 3,
        alignSelf: 'flex-end',
        fontSize: 18,
    },
})

class Header extends Component {
    constructor(props) {
        super(props)

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            connectionState: ApplicationStore.getConnectionState(),
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState !== this.state) {
            return true
        }

        if (nextProps.theme !== this.props.theme) {
            return true
        }

        if (nextProps.chat !== this.props.chat) {
            return true
        }

        if (nextProps.t !== this.props.t) {
            return true
        }

        return false
    }

    componentDidMount() {
        ApplicationStore.on('updateConnectionState', this.onUpdateConnectionState)
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState)

        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected)
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateMessageSelected)

        ChatStore.on('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount)
        UserStore.on('updateUserStatus', this.onUpdateUserStatus)
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo)
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo)
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo)
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup)
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup)
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateConnectionState', this.onUpdateConnectionState)
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState)

        MessageStore.removeListener(
            'clientUpdateMessageSelected',
            this.onClientUpdateMessageSelected
        )
        MessageStore.removeListener(
            'clientUpdateClearSelection',
            this.onClientUpdateMessageSelected
        )

        ChatStore.removeListener('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount)
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus)
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo)
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo)
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo)
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup)
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup)
    }

    onUpdateChatOnlineMemberCount = update => {
        const { chat } = this.props
        if (!chat) return
        if (chat.id !== update.chat_id) return

        this.forceUpdate()
    }

    onClientUpdateMessageSelected = update => {
        this.setState({ selectionCount: MessageStore.selectedItems.size })
    }

    onUpdateConnectionState = update => {
        this.setState({ connectionState: update.state })
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state })
    }

    onUpdateUserStatus = update => {
        const { chat } = this.props
        if (!chat) return
        if (!chat.type) return

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id)
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id)
                    if (member) {
                        this.forceUpdate()
                    }
                }
                break
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate()
                }
                break
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate()
                }
                break
            }
            case 'chatTypeSupergroup': {
                break
            }
        }
    }

    onUpdateBasicGroup = update => {
        const { chat } = this.props
        if (!chat) return

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group.id
        ) {
            this.forceUpdate()
        }
    }

    onUpdateSupergroup = update => {
        const { chat } = this.props
        if (!chat) return

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup.id
        ) {
            this.forceUpdate()
        }
    }

    onUpdateBasicGroupFullInfo = update => {
        const { chat } = this.props
        if (!chat) return

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group_id
        ) {
            this.forceUpdate()
        }
    }

    onUpdateSupergroupFullInfo = update => {
        const { chat } = this.props
        if (!chat) return

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup_id
        ) {
            this.forceUpdate()
        }
    }

    onUpdateUserFullInfo = update => {
        const { chat } = this.props
        if (!chat) return

        if (
            chat.type &&
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.forceUpdate()
        }
    }

    openChatDetails = () => {
        const { chat } = this.props
        if (!chat) return

        ApplicationStore.changeChatDetailsVisibility(true)
    }

    handleSearchChat = () => {
        const { chat } = this.props
        if (!chat) return

        ApplicationStore.searchChat(chat.id)
    }

    localize = str => {
        const { t } = this.props

        return t(str)
            .replace('...', '')
            .replace('…', '')
    }

    render() {
        const { classes, t, chat } = this.props
        const { authorizationState, connectionState, selectionCount } = this.state

        if (selectionCount) {
            return <HeaderCommand count={selectionCount} />
        }

        const chatId = chat ? chat.id : null

        const isAccentSubtitle = isAccentChatSubtitle(chatId)
        let title = getChatTitle(chatId, true, t)
        let subtitle = getChatSubtitle(chat, true)
        let showProgressAnimation = false

        const isVerified = isVerifiedChat(chat)

        if (connectionState) {
            switch (connectionState['@type']) {
                case 'connectionStateConnecting':
                    title = this.localize('Connecting')
                    subtitle = ''
                    showProgressAnimation = true
                    break
                case 'connectionStateConnectingToProxy':
                    title = this.localize('Connecting to proxy')
                    subtitle = ''
                    showProgressAnimation = true
                    break
                case 'connectionStateReady':
                    break
                case 'connectionStateUpdating':
                    title = this.localize('Updating')
                    subtitle = ''
                    showProgressAnimation = true
                    break
                case 'connectionStateWaitingForNetwork':
                    title = this.localize('Waiting for network')
                    subtitle = ''
                    showProgressAnimation = true
                    break
            }
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
                case 'authorizationStateClosed':
                    break
                case ' authorizationStateClosing':
                    break
                case 'authorizationStateLoggingOut':
                    title = this.localize('Logging out')
                    subtitle = ''
                    showProgressAnimation = true
                    break
                case 'authorizationStateReady':
                    break
                case 'authorizationStateWaitCode':
                    break
                case 'authorizationStateWaitEncryptionKey':
                    title = this.localize('Loading')
                    subtitle = ''
                    showProgressAnimation = true
                    break
                case 'authorizationStateWaitPassword':
                    break
                case 'authorizationStateWaitPhoneNumber':
                    break
                case 'authorizationStateWaitTdlibParameters':
                    title = this.localize('Loading')
                    subtitle = ''
                    showProgressAnimation = true
                    break
            }
        } else {
            title = this.localize('Loading')
            subtitle = ''
            showProgressAnimation = true
        }

        return (
            <div className={classNames(classes.borderColor, 'header-details')}>
                <div
                    className={classNames(
                        'header-status',
                        'grow',
                        chat ? 'cursor-pointer' : 'cursor-default'
                    )}
                    onClick={this.openChatDetails}>
                    <span className='header-status-content'>{title}</span>
                    {!showProgressAnimation && isVerified && (
                        <VerifiedBadgeIcon className={classes.titleIcon} />
                    )}
                    {showProgressAnimation && (
                        <>
                            <span className='header-progress'>.</span>
                            <span className='header-progress'>.</span>
                            <span className='header-progress'>.</span>
                        </>
                    )}
                    <span
                        className={classNames('header-status-title', {
                            [classes.headerStatusAccentTitle]: isAccentSubtitle,
                        })}>
                        {subtitle}
                    </span>
                    <span className='header-status-tail' />
                </div>
                {chat && (
                    <>
                        <IconButton
                            className={classes.messageSearchIconButton}
                            aria-label='Search'
                            onClick={this.handleSearchChat}>
                            <SearchIcon />
                        </IconButton>
                        <MainMenuButton openChatDetails={this.openChatDetails} />
                    </>
                )}
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        chat: state.currentChat.id !== 0 ? state.chats.get(state.currentChat.id.toString()) : null,
    }
}

Header.propTypes = {
    chat: PropTypes.object,
}

const enhance = compose(
    connect(mapStateToProps),
    withTranslation(),
    withStyles(styles, { withTheme: true })
)

export default enhance(Header)
