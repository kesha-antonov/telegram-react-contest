/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import FooterCommand from './FooterCommand'
import NotificationsControl from './NotificationsControl'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { isChatMuted } from '../../Utils/Chat'

class NotificationsCommandControl extends NotificationsControl {
    render() {
        const { chat } = this.props
        const command = isChatMuted(chat) ? 'unmute' : 'mute'

        return <FooterCommand command={command} onCommand={this.handleSetChatNotifications} />
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        chat: state.chats.get(ownProps.chatId.toString()),
    }
}

NotificationsCommandControl.propTypes = {
    chatId: PropTypes.object.isRequired,
    chat: PropTypes.object.isRequired,
}

export default connect(mapStateToProps)(NotificationsCommandControl)
