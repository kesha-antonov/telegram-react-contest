/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { withTranslation } from 'react-i18next'
import { getChatTitle } from '../../Utils/Chat'
import ChatStore from '../../Stores/ChatStore'
import SupergroupStore from '../../Stores/SupergroupStore'
import { hasSupergroupId, isVerifiedChat } from '../../Utils/Chat'
import './DialogTitleControl.css'
import { compose } from 'recompose'
import VerifiedBadgeIcon from '../Icons/VerifiedBadgeIcon'
import { connect } from 'react-redux'
import withStyles from '@material-ui/core/styles/withStyles'

const styles = () => ({
    row: {
        display: 'flex',
        flexGrow: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
    },
    verifiedBadgeIconSelectedColor: {
        color: '#fff',
    },
    titleIcon: {
        marginLeft: 5,
        fontSize: 15,
    },
})

class DialogTitleControl extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true
        }

        if (nextProps.t !== this.props.t) {
            return true
        }

        if (nextProps.highlightVerifiedBadge !== this.props.highlightVerifiedBadge) {
            return true
        }

        if (nextProps.theme !== this.props.theme) {
            return true
        }

        return false
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete)
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup)
    }

    componentWillUnmount() {
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete)
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup)
    }

    onUpdateSupergroup = update => {
        const { chatId } = this.props

        if (hasSupergroupId(chatId, update.supergroup.id)) {
            this.forceUpdate()
        }
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate()
    }

    render() {
        const { t, classes, chatId, chat, showSavedMessages, highlightVerifiedBadge } = this.props

        const title = getChatTitle(chatId, showSavedMessages, t)

        const isVerified = isVerifiedChat(chat)

        return (
            <div className={classes.row}>
                <div className='dialog-title'>{title}</div>
                {isVerified && (
                    <VerifiedBadgeIcon
                        className={classes.titleIcon}
                        color={highlightVerifiedBadge ? 'action' : 'primary'}
                        classes={{
                            colorAction: classes.verifiedBadgeIconSelectedColor,
                        }}
                    />
                )}
            </div>
        )
    }
}

DialogTitleControl.propTypes = {
    theme: PropTypes.object.isRequired,
    chatId: PropTypes.number.isRequired,
    chat: PropTypes.object.isRequired,
    showSavedMessages: PropTypes.bool,
    highlightVerifiedBadge: PropTypes.bool.isRequired,
}

DialogTitleControl.defaultProps = {
    showSavedMessages: true,
    highlightVerifiedBadge: false,
}

const mapStateToProps = (state, ownProps) => {
    return {
        chat: state.chats.get(ownProps.chatId.toString()),
    }
}

const enhance = compose(
    connect(mapStateToProps),
    withStyles(styles, { withTheme: true }),
    withTranslation()
)

export default enhance(DialogTitleControl)
