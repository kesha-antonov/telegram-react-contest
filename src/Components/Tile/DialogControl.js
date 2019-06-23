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
import MessageSendingStatus from '../Message/MessageSendingStatus'
import { openChat } from '../../Actions/Client'
import SupergroupStore from '../../Stores/SupergroupStore'
import './DialogControl.css'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import { isChatMuted, showChatDraft, isMeChat } from '../../Utils/Chat'

const styles = theme => ({
    statusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1,
    },
    statusIcon: {},
    dialogActive: {
        color: '#fff', //theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '& $statusRoot': {
            background: theme.palette.primary.main,
        },
    },
    dialog: {
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '&:hover': {
            backgroundColor: theme.palette.primary.main + '22',
            '& $statusRoot': {
                background:
                    theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
            },
            '& $statusIcon': {
                background: theme.palette.primary.main + '22',
            },
        },
    },
    titleAndIcons: {
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
    },
})

class DialogControl extends Component {
    constructor() {
        super()

        this.dialog = React.createRef()
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chat !== this.props.chat) {
            return true
        }

        if (nextProps.isSelected !== this.props.isSelected) {
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

    handleSelect = () => {
        openChat(this.props.chat.id)
    }

    render() {
        const { classes, chat, showSavedMessages, hidden, isSelected } = this.props

        if (hidden) return null

        const showDraftChat = showChatDraft(chat.id)
        const _isMeChat = isMeChat(chat)

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
                        chatId={chat.id}
                        showSavedMessages={showSavedMessages}
                        showOnline
                        classes={{
                            statusRoot: classes.statusRoot,
                            statusIcon: classes.statusIcon,
                        }}
                    />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className={classes.titleAndIcons}>
                                <DialogTitleControl
                                    chatId={chat.id}
                                    highlightVerifiedBadge={isSelected}
                                />
                                {isChatMuted(chat) && <i className='dialog-badge-muted' />}
                            </div>
                            <div className='tile-first-row__right-row'>
                                {!showDraftChat && !_isMeChat && chat.last_message && (
                                    <MessageSendingStatus
                                        chatId={chat.id}
                                        messageId={chat.last_message.id}
                                        iconColor={isSelected ? '#fff' : null}
                                    />
                                )}
                                <DialogMetaControl chatId={chat.id} />
                            </div>
                        </div>
                        <div className='tile-second-row'>
                            <DialogContentControl chatId={chat.id} />
                            <DialogBadgeControl chatId={chat.id} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

DialogControl.propTypes = {
    chat: PropTypes.object.isRequired,
    chatId: PropTypes.number.isRequired,
    currentChatId: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    showSavedMessages: PropTypes.bool,
    theme: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
}

DialogControl.defaultProps = {
    hidden: false,
    showSavedMessages: true,
}

const mapStateToProps = (state, ownProps) => {
    return {
        chat: state.chats.get(ownProps.chatId.toString()),
        isSelected: ownProps.chatId === state.currentChatId,
    }
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true })
)

export default enhance(DialogControl)
