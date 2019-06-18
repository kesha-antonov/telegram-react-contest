/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import classNames from 'classnames'
import withStyles from '@material-ui/core/styles/withStyles'
import VolumeMuteIcon from '@material-ui/icons/VolumeMute'
import VolumeDownIcon from '@material-ui/icons/VolumeDown'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import IconButton from '@material-ui/core/IconButton'
import Slider from '@material-ui/lab/Slider'
import { borderStyle } from '../Theme'
import { PLAYER_VOLUME_NORMAL } from '../../Constants'
import PlayerStore from '../../Stores/PlayerStore'
import TdLibController from '../../Controllers/TdLibController'
import './VolumeButton.css'

const styles = theme => ({
    iconButton: {
        padding: 4
    },
    root: {
        display: 'flex',
        height: 100,
        width: 28,
        padding: '13px 0',
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
    },
    slider: {
        padding: '0 13px'
    },
    thumb: {
        opacity: 0
    },
    ...borderStyle(theme)
})

class VolumeButton extends React.Component {
    constructor() {
        super()

        this.state = {
            anchorEl: null,
            value: PlayerStore.volume,
            prevValue: PlayerStore.volume
        }

        this.dragging = false
        this.buttonOver = false
        this.popupOver = false
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaVolume', this.onClientUpdateMediaVolume)
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaVolume', this.onClientUpdateMediaVolume)
    }

    onClientUpdateMediaVolume = update => {
        const { volume, prevVolume } = update

        let newState = {}
        if (this.state.value !== volume) newState['value'] = volume

        if (prevVolume) newState['prevVolume'] = prevVolume

        this.setState(newState)
    }

    handlePopoverOpen = anchorEl => {
        this.setState({ anchorEl: anchorEl })
    }

    handlePopoverClose = () => {
        const { buttonOver, popupOver, dragging } = this

        if (dragging) return
        if (buttonOver) return
        if (popupOver) return

        this.setState({ anchorEl: null })
    }

    handleMouseEnter = (event, openPopover) => {
        this.buttonOver = true

        if (openPopover) {
            this.handlePopoverOpen(event.currentTarget)
        }
    }

    handleMouseLeave = () => {
        this.buttonOver = false
        this.handlePopoverClose()
    }

    handlePopupMouseLeave = () => {
        this.popupOver = false
        this.handlePopoverClose()
    }

    handleVoiceClick = () => {
        const { value, prevValue } = this.state
        const nextValue = value > 0 ? 0 : prevValue || PLAYER_VOLUME_NORMAL

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaVolume',
            volume: nextValue
        })
    }

    onChange = (event, value) => {
        if (value === this.state) {
            return
        }

        this.setState({ value }, () => {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaVolume',
                volume: value
            })
        })
    }

    onDragEnd = (event, value) => {
        this.setState({ value }, this.handlePopoverClose)
    }

    getVolumeIcon = () => {
        const { value } = this.state

        if (value === 0) {
            return <VolumeOffIcon fontSize='small' />
        }

        if (value < 0.25) {
            return <VolumeMuteIcon fontSize='small' />
        }

        if (value < 0.5) {
            return <VolumeDownIcon fontSize='small' />
        }

        return <VolumeUpIcon fontSize='small' />
    }

    onMouseDown = () => {
        this.dragging = true
    }

    onMouseUp = () => {
        this.dragging = false
        this.handlePopoverClose()
    }

    onChangeCommitted = () => {
        if (this.dragging) {
            this.dragging = false
            this.handlePopoverClose()
        }
    }

    render() {
        const { classes } = this.props
        const { anchorEl, value } = this.state
        const open = Boolean(anchorEl)

        return (
            <div
                onMouseEnter={e => this.handleMouseEnter(e, true)}
                onMouseLeave={this.handleMouseLeave}
                style={{
                    position: 'relative',
                    background: 'transparent'
                }}>
                <IconButton className={classes.iconButton} color='primary' onClick={this.handleVoiceClick}>
                    {this.getVolumeIcon()}
                </IconButton>
                <div
                    style={{
                        position: 'absolute',
                        background: 'transparent',
                        visibility: open ? 'visible' : 'hidden',
                        zIndex: 1
                    }}
                    onMouseEnter={e => this.handleMouseEnter(e, false)}
                    onMouseLeave={this.handlePopupMouseLeave}>
                    <div
                        className={classNames(classes.borderColor, classes.root)}
                        style={{
                            marginTop: 8,
                            borderWidth: 1,
                            borderStyle: 'solid'
                        }}>
                        <Slider
                            classes={{
                                root: classes.slider,
                                thumb: classes.thumb
                            }}
                            min={0}
                            max={1}
                            step={0.01}
                            value={value}
                            onChange={this.onChange}
                            onChangeCommitted={this.onChangeCommitted}
                            orientation='vertical'
                            onMouseDown={this.onMouseDown}
                            onMouseUp={this.onMouseUp}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

export default withStyles(styles, { withTheme: true })(VolumeButton)
