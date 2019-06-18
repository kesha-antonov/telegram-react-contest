/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import withStyles from '@material-ui/core/styles/withStyles'
import ChatTileControl from './ChatTileControl'
import DialogContentControl from './DialogContentControl'
import DialogBadgeControl from './DialogBadgeControl'
import DialogTitleControl from './DialogTitleControl'
import DialogMetaControl from './DialogMetaControl'
import { openChat } from '../../Actions/Client'
import ChatStore from '../../Stores/ChatStore'
import ApplicationStore from '../../Stores/ApplicationStore'
import './DialogControl.css'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import CheckDecagramIcon from 'mdi-material-ui/CheckDecagram'
import blue from '@material-ui/core/colors/blue'

const OFFICIAL_TELEGRAM_CHATS_IDS = [796917078, -1001038976893, 777000, -1001322215945, -1001416855018]

const styles = theme => ({
    statusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1
    },
    statusIcon: {},
    dialogActive: {
        color: '#fff', //theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '& $statusRoot': {
            background: theme.palette.primary.main
        }
    },
    dialog: {
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '&:hover': {
            backgroundColor: theme.palette.primary.main + '22',
            '& $statusRoot': {
                background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
            },
            '& $statusIcon': {
                background: theme.palette.primary.main + '22'
            }
        }
    },
    titleAndIcons: {
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden'
    },
    titleIcon: {
        marginLeft: 5
    },
    iconSmall: {
        fontSize: 15
    },
    verifiedBadgeIconUnselectedColor: {
        color: blue[400]
    },
    verifiedBadgeIconSelectedColor: {
        color: '#fff'
    },
    volumeOffIconUnselectedColor: {
        color: theme.palette.grey[400]
    },
    volumeOffIconSelectedColor: {
        color: theme.palette.grey[300]
    }
})

class DialogControl extends Component {
    constructor(props) {
        super(props)

        this.dialog = React.createRef()

        const chat = ChatStore.get(this.props.chatId)
        this.state = {
            chat
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true
        }

        if (nextProps.theme !== this.props.theme) {
            return true
        }

        if (nextProps.hidden !== this.props.hidden) {
            return true
        }

        return false
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId)
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId)
    }

    onClientUpdateChatId = update => {
        const { chatId } = this.props

        if (chatId === update.previousChatId || chatId === update.nextChatId) {
            this.forceUpdate()
        }
    }

    handleSelect = () => {
        openChat(this.props.chatId)
    }

    render() {
        const { classes, chatId, showSavedMessages, hidden } = this.props

        if (hidden) return null

        const currentChatId = ApplicationStore.getChatId()
        const isSelected = currentChatId === chatId

        const { chat } = this.state
        // console.log('chat', chat)

        return (
            <div
                ref={this.dialog}
                className={classNames(
                    isSelected ? classes.dialogActive : classes.dialog,
                    isSelected ? 'dialog-active' : 'dialog'
                )}
                onMouseDown={this.handleSelect}>
                <div className='dialog-wrapper'>
                    <ChatTileControl
                        chatId={chatId}
                        showSavedMessages={showSavedMessages}
                        showOnline
                        classes={{ statusRoot: classes.statusRoot, statusIcon: classes.statusIcon }}
                    />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className={classes.titleAndIcons}>
                                <DialogTitleControl chatId={chatId} />
                                {OFFICIAL_TELEGRAM_CHATS_IDS.indexOf(chat.id) > -1 ? (
                                    <CheckDecagramIcon
                                        className={classes.titleIcon}
                                        color={isSelected ? 'action' : 'primary'}
                                        fontSize='small'
                                        classes={{
                                            fontSizeSmall: classes.iconSmall,
                                            colorPrimary: classes.verifiedBadgeIconUnselectedColor,
                                            colorAction: classes.verifiedBadgeIconSelectedColor
                                        }}
                                    />
                                ) : (
                                    void 0
                                )}
                                {chat.notification_settings.mute_for ? (
                                    <VolumeOffIcon
                                        color={isSelected ? 'action' : 'primary'}
                                        fontSize='small'
                                        className={classes.titleIcon}
                                        classes={{
                                            fontSizeSmall: classes.iconSmall,
                                            colorPrimary: classes.volumeOffIconUnselectedColor,
                                            colorAction: classes.volumeOffIconSelectedColor
                                        }}
                                    />
                                ) : (
                                    void 0
                                )}
                            </div>
                            <DialogMetaControl chatId={chatId} />
                        </div>
                        <div className='tile-second-row'>
                            <DialogContentControl chatId={chatId} />
                            <DialogBadgeControl chatId={chatId} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

DialogControl.propTypes = {
    chatId: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    showSavedMessages: PropTypes.bool
}

DialogControl.defaultProps = {
    hidden: false,
    showSavedMessages: true
}

export default withStyles(styles, { withTheme: true })(DialogControl)
