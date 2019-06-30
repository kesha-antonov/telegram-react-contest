/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import withStyles from '@material-ui/core/styles/withStyles'
import IconButton from '@material-ui/core/IconButton'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import PlayerStore from '../../Stores/PlayerStore'
import TdLibController from '../../Controllers/TdLibController'

const styles = {
    iconButton: {
        padding: 4,
    },
}

class ShuffleButton extends React.Component {
    constructor(props) {
        super(props)

        const { shuffle } = PlayerStore

        this.state = {
            shuffle,
        }
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaShuffle', this.onClientUpdateMediaShuffle)
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaShuffle', this.onClientUpdateMediaShuffle)
    }

    onClientUpdateMediaShuffle = update => {
        const { shuffle } = update

        this.setState({ shuffle })
    }

    handleShuffle = () => {
        const { shuffle } = this.state

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaShuffle',
            shuffle: !shuffle,
        })
    }

    render() {
        const { classes } = this.props
        const { shuffle } = this.state

        return (
            <IconButton
                className={classes.iconButton}
                color={!shuffle ? 'default' : 'primary'}
                onClick={this.handleShuffle}>
                <ShuffleIcon fontSize='small' />
            </IconButton>
        )
    }
}

export default withStyles(styles)(ShuffleButton)
