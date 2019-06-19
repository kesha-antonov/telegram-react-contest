/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { isChatMuted } from '../../Utils/Chat'
import { debounce } from '../../Utils/Common'
import { MUTED_VALUE_MAX, NOTIFICATIONS_DEBOUNCE_DELAY_MS, MUTED_VALUE_MIN } from '../../Constants'
import ChatStore from '../../Stores/ChatStore'
import ApplicationStore from '../../Stores/ApplicationStore'
import TdLibController from '../../Controllers/TdLibController'

class NotificationsControl extends React.Component {
    constructor(props) {
        super(props)

        this.debouncedSetChatNotificationSettings = debounce(
            this.setChatNotificationSettings,
            NOTIFICATIONS_DEBOUNCE_DELAY_MS
        )

        this.notSavedIsMuted = null
    }

    componentDidMount() {
        ApplicationStore.on(
            'updateScopeNotificationSettings',
            this.onUpdateScopeNotificationSettings
        )
    }

    componentWillUnmount() {
        ApplicationStore.removeListener(
            'updateScopeNotificationSettings',
            this.onUpdateScopeNotificationSettings
        )
    }

    onUpdateScopeNotificationSettings = update => {
        const chat = this.getChat()
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

    getNewNotificationSettings = (chat, isMuted) => {
        const muteFor = isMuted ? MUTED_VALUE_MAX : MUTED_VALUE_MIN

        return {
            ...chat.notification_settings,
            use_default_mute_for: false,
            mute_for: muteFor,
        }
    }

    getChat = () => {
        const { chatId } = this.props
        return ChatStore.get(chatId)
    }

    handleSetChatNotifications = () => {
        const chat = this.getChat()
        if (!chat) return

        const isMuted = !isChatMuted(chat)

        this.notSavedIsMuted = isMuted

        ChatStore.updateChat(chat, {
            notification_settings: this.getNewNotificationSettings(chat, isMuted),
        })

        this.debouncedSetChatNotificationSettings()
    }

    setChatNotificationSettings = async () => {
        const chat = this.getChat()
        if (!chat) return
        if (!chat.notification_settings) return

        const isMuted = isChatMuted(chat)
        if (this.notSavedIsMuted != null && this.notSavedIsMuted === isMuted) {
            this.notSavedIsMuted = null
            let res = await TdLibController.send({
                '@type': 'setChatNotificationSettings',
                chat_id: chat.id,
                notification_settings: chat.notification_settings,
            })
        }
    }
}

export default NotificationsControl
