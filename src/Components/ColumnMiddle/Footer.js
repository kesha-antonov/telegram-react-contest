/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import InputBoxControl from './InputBoxControl'
import FooterCommand from './FooterCommand'
import NotificationsCommandControl from './NotificationsCommandControl'
import { hasBasicGroupId, hasSupergroupId } from '../../Utils/Chat'
import BasicGroupStore from '../../Stores/BasicGroupStore'
import SupergroupStore from '../../Stores/SupergroupStore'
import TdLibController from '../../Controllers/TdLibController'
import { connect } from 'react-redux'
import './Footer.css'

class Footer extends React.Component {
    constructor(props) {
        super(props)
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chat !== this.props.chat) {
            return true
        }

        return false
    }

    componentDidMount() {
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup)
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup)
    }

    componentWillUnmount() {
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup)
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup)
    }

    onUpdateBasicGroup = update => {
        const { chat } = this.props
        if (!chat) return

        if (hasBasicGroupId(chat.id, update.basic_group.id)) {
            this.forceUpdate()
        }
    }

    onUpdateSupergroup = update => {
        const { chat } = this.props
        if (!chat) return

        if (hasSupergroupId(chat.id, update.supergroup.id)) {
            this.forceUpdate()
        }
    }

    handleJoin = () => {
        const { chat } = this.props
        if (!chat) return

        TdLibController.send({
            '@type': 'joinChat',
            chat_id: chat.id,
        })
    }

    handleDeleteAndExit = () => {
        const { chat } = this.props
        if (!chat) return

        TdLibController.send({
            '@type': 'deleteChatHistory',
            chat_id: chat.id,
            remove_from_chat_list: true,
        })

        // TdLibController
        //     .send({
        //         '@type': 'leaveChat',
        //         chat_id: this.props.chat.id
        //     });
    }

    render() {
        const { chat } = this.props
        if (!chat) return null
        if (!chat.type) return null

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const basicGroup = BasicGroupStore.get(chat.type.basic_group_id)
                if (basicGroup && basicGroup.status) {
                    switch (basicGroup.status['@type']) {
                        case 'chatMemberStatusAdministrator': {
                            return <InputBoxControl />
                        }
                        case 'chatMemberStatusBanned': {
                            return (
                                <FooterCommand
                                    command='delete and exit'
                                    onCommand={this.handleDeleteAndExit}
                                />
                            )
                        }
                        case 'chatMemberStatusCreator': {
                            return <InputBoxControl />
                        }
                        case 'chatMemberStatusLeft': {
                            return null
                        }
                        case 'chatMemberStatusMember': {
                            return <InputBoxControl />
                        }
                        case 'chatMemberStatusRestricted': {
                            if (basicGroup.status.is_member) {
                                if (!basicGroup.status.can_send_messages) {
                                    return null
                                }

                                return <InputBoxControl />
                            } else {
                                return <FooterCommand command='join' onCommand={this.handleJoin} />
                            }
                        }
                    }
                }

                break
            }
            case 'chatTypePrivate': {
                return <InputBoxControl />
            }
            case 'chatTypeSecret': {
                return <InputBoxControl />
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id)
                if (supergroup && supergroup.status) {
                    switch (supergroup.status['@type']) {
                        case 'chatMemberStatusAdministrator': {
                            return <InputBoxControl />
                        }
                        case 'chatMemberStatusBanned': {
                            return (
                                <FooterCommand
                                    command='delete and exit'
                                    onCommand={this.handleDeleteAndExit}
                                />
                            )
                        }
                        case 'chatMemberStatusCreator': {
                            return <InputBoxControl />
                        }
                        case 'chatMemberStatusLeft': {
                            return <FooterCommand command='join' onCommand={this.handleJoin} />
                        }
                        case 'chatMemberStatusMember': {
                            if (supergroup.is_channel) {
                                return <NotificationsCommandControl chatId={chat.id} />
                            } else {
                                return <InputBoxControl />
                            }
                        }
                        case 'chatMemberStatusRestricted': {
                            if (supergroup.status.is_member) {
                                if (!supergroup.status.can_send_messages) {
                                    return null
                                }

                                return <InputBoxControl />
                            } else {
                                return <FooterCommand command='join' onCommand={this.handleJoin} />
                            }
                        }
                    }
                }
            }
        }

        return null
    }
}

const mapStateToProps = state => {
    return {
        chat: state.currentChatId ? state.chats.get(state.currentChatId.toString()) : null,
    }
}

Footer.propTypes = {
    chat: PropTypes.object,
}

export default connect(mapStateToProps)(Footer)
