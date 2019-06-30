/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react'
import classNames from 'classnames'
import ChatInfoDialog from '../Dialog/ChatInfoDialog'
import Footer from './Footer'
import Header from './Header'
import HeaderPlayer from '../Player/HeaderPlayer'
import MessagesList from './MessagesList'
import PinnedMessage from './PinnedMessage'
import StickerSetDialog from '../Dialog/StickerSetDialog'
import ApplicationStore from '../../Stores/ApplicationStore'
import './DialogDetails.css'

class DialogDetails extends Component {
    componentDidMount() {
        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility)
    }

    componentWillUnmount() {
        ApplicationStore.removeListener(
            'clientUpdateChatDetailsVisibility',
            this.onUpdateChatDetailsVisibility
        )
    }

    onUpdateChatDetailsVisibility = update => {
        this.forceUpdate()
    }

    scrollToBottom = () => {
        this.messagesList.scrollToBottom()
    }

    scrollToStart = () => {
        this.messagesList.scrollToStart()
    }

    scrollToMessage = () => {
        this.messagesList.scrollToMessage()
    }

    render() {
        /*let groups = [];
        if (this.props.history.length > 0){
            let currentGroup = {
                key: this.props.history[0].id,
                date: this.props.history[0].date,
                senderUserId: this.props.history[0].sender_user_id,
                messages: [this.props.history[0]]
            };

            for (let i = 1; i < this.props.history.length; i++){
                if (this.props.history[i].sender_user_id === currentGroup.senderUserId
                    && Math.abs(this.props.history[i].date - currentGroup.date) <= 10 * 60
                    && i % 20 !== 0){
                    currentGroup.key += '_' + this.props.history[i].id;
                    currentGroup.messages.push(this.props.history[i]);
                }
                else {
                    groups.push(currentGroup);
                    currentGroup = {
                        key: this.props.history[i].id,
                        date: this.props.history[i].date,
                        senderUserId: this.props.history[i].sender_user_id,
                        messages: [this.props.history[i]]
                    };
                }
            }
            groups.push(currentGroup);
        }

        this.groups = groups.map(x => {
            return (<MessageGroup key={x.key} senderUserId={x.senderUserId} messages={x.messages} onSelectChat={this.props.onSelectChat}/>);
        });*/
        const { isChatDetailsVisible } = ApplicationStore

        return (
            <div
                className={classNames('dialog-details', {
                    'dialog-details-third-column': isChatDetailsVisible,
                })}>
                <Header />
                <HeaderPlayer />
                <MessagesList innerRef={ref => (this.messagesList = ref)} />
                <Footer />
                <StickerSetDialog />
                <ChatInfoDialog />
            </div>
        )
    }
}

export default DialogDetails
