/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { compose } from 'recompose'
import withStyles from '@material-ui/core/styles/withStyles'
import { withTranslation } from 'react-i18next'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import NotificationsIcon from '@material-ui/icons/Notifications'
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive'
import Switch from '@material-ui/core/Switch'
import Typography from '@material-ui/core/Typography'
import NotificationsControl from '../ColumnMiddle/NotificationsControl'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { isChatMuted } from '../../Utils/Chat'

const styles = {
    listItem: {
        padding: '11px 22px',
    },
}

class NotificationsListItem extends NotificationsControl {
    render() {
        const { classes, t, chat } = this.props
        const isMuted = isChatMuted(chat)

        return (
            <ListItem button className={classes.listItem} onClick={this.handleSetChatNotifications}>
                <ListItemIcon>
                    {!isMuted ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Typography variant='inherit' noWrap>
                            {t('Notifications')}
                        </Typography>
                    }
                />
                <ListItemSecondaryAction>
                    <Switch
                        color='primary'
                        onChange={this.handleSetChatNotifications}
                        checked={!isMuted}
                    />
                </ListItemSecondaryAction>
            </ListItem>
        )
    }
}

NotificationsListItem.propTypes = {
    chatId: PropTypes.object.isRequired,
    chat: PropTypes.object.isRequired,
}

const mapStateToProps = (state, ownProps) => {
    return {
        chat: state.chats.get(ownProps.chatId.toString()),
    }
}

const enhance = compose(
    connect(mapStateToProps),
    withTranslation(),
    withStyles(styles, { withTheme: true })
)

export default enhance(NotificationsListItem)
