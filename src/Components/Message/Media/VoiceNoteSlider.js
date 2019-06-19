/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import withStyles from '@material-ui/core/styles/withStyles'
import Slider from '@material-ui/lab/Slider'
import { PLAYER_PROGRESS_TIMEOUT_MS } from '../../../Constants'
import PlayerStore from '../../../Stores/PlayerStore'
import './VoiceNoteSlider.css'
import TdLibController from '../../../Controllers/TdLibController'
import classNames from 'classnames'

const styles = {
    slider: {
        maxWidth: 216
    },
    sliderDisabled: {
        pointerEvents: 'none'
    },
    trackDisabled: {
        transition: 'width 0ms linear 0ms, height 0ms linear 0ms, transform 0ms linear 0ms'
    },
    thumbDisabled: {
        transition: 'transform 0ms linear 0ms, box-shadow 0ms linear 0ms'
    }
}

class VoiceNoteSlider extends React.Component {
    constructor(props) {
        super(props)

        const { message, time } = PlayerStore
        const { chatId, messageId, duration } = this.props

        const active = message && message.chat_id === chatId && message.id === messageId
        const currentTime = active && time ? time.currentTime : 0
        const audioDuration = active && time && time.duration ? time.duration : duration

        this.state = {
            active,
            currentTime,
            duration: audioDuration,
            value: this.getValue(currentTime, audioDuration, active)
        }

        this.playAfterFinishDraggingCurrentTime = false
        this.dragging = false
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive)
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime)
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd)
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { active, value } = this.state

        if (nextState.value !== value) {
            return true
        }

        if (nextState.active !== active) {
            return true
        }

        return false
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive)
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime)
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd)
    }

    togglePlayPause = () => {
        const { active, currentTime, duration } = this.state

        if (!active) return

        const { chatId, messageId } = this.props

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaActive',
            chatId,
            messageId
        })
    }

    reset = () => {
        const { duration } = this.props
        const { value } = this.state

        let newState = {
            active: false,
            currentTime: 0
        }

        if (value === 1) {
            this.setState(newState)

            setTimeout(() => {
                const { currentTime } = this.state
                if (!currentTime) {
                    this.setState({
                        value: this.getValue(0, duration, false)
                    })
                }
            }, PLAYER_PROGRESS_TIMEOUT_MS)
        } else {
            newState['value'] = this.getValue(0, duration, false)
            this.setState(newState)
        }
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props

        if (chatId === update.chatId && messageId === update.messageId) {
            this.reset()
        }
    }

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, duration } = this.props
        const { active } = this.state

        if (chatId === update.chatId && messageId === update.messageId) {
            let newState = {
                currentTime: update.currentTime,
                duration: update.duration || duration
            }
            if (PlayerStore.playing) {
                const value = this.getValue(update.currentTime, update.duration || duration, active)
                newState['value'] = value
            }

            this.setState(newState)
        }
    }

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, duration } = this.props
        const { active, currentTime } = this.state

        if (chatId === update.chatId && messageId === update.messageId) {
            const currentTime = active ? currentTime : 0
            if (!this.state.active || currentTime !== this.state.currentTime) {
                this.setState({
                    active: true,
                    currentTime,
                    value: this.getValue(currentTime, duration, true)
                })
            }
        } else if (active) {
            this.reset()
        }
    }

    tryPlay = () => {
        if (this.playAfterFinishDraggingCurrentTime && !this.dragging && !PlayerStore.playing) {
            this.playAfterFinishDraggingCurrentTime = false
            this.togglePlayPause()
        }
    }

    getValue = (currentTime, duration, active) => {
        return active ? currentTime / duration : 0
    }

    onChange = (event, value) => {
        if (this.state.active && PlayerStore.playing && !this.playAfterFinishDraggingCurrentTime) {
            this.playAfterFinishDraggingCurrentTime = true
            this.togglePlayPause()
        }

        const { chatId, messageId, duration } = this.props

        const currentTime = duration * value

        this.setState({ value, currentTime }, () => {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaTime',
                chatId,
                messageId,
                duration,
                currentTime,
                timestamp: Date.now()
            })
            this.tryPlay()
        })
    }

    onMouseDown = () => {
        this.dragging = true
    }

    onMouseUp = () => {
        this.dragging = false
    }

    onChangeCommitted = (event, value) => {
        if (this.dragging) {
            this.onMouseUp()
            this.onChange(event, value)
        }
    }

    onClick = event => {
        const { active } = this.state

        if (active) {
            event.preventDefault()
            event.stopPropagation()
        }
    }

    render() {
        const { classes } = this.props
        const { value, active } = this.state

        return (
            <div className='voice-note-slider' onClick={this.onClick}>
                <Slider
                    className={classNames(classes.slider, {
                        [classes.sliderDisabled]: !active
                    })}
                    classes={{
                        track: classNames({
                            [classes.trackDisabled]: !active
                        }),
                        thumb: classNames({
                            [classes.thumbDisabled]: !active
                        })
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    value={value}
                    onChange={this.onChange}
                    orientation='horizontal'
                    onChangeCommitted={this.onChangeCommitted}
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                    onClick={this.onClick}
                    aria-labelledby='continuous-slider'
                />
            </div>
        )
    }
}

VoiceNoteSlider.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired
}

export default withStyles(styles)(VoiceNoteSlider)
