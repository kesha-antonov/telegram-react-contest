/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import blue from '@material-ui/core/colors/blue'
import createMuiTheme from '@material-ui/core/styles/createMuiTheme'
// import { ThemeProvider } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'
import { getDisplayName } from './Utils/HOC'
import ApplicationStore from './Stores/ApplicationStore'
import { setPalette } from './Stores/ReduxStore/actions'
import { connect } from 'react-redux'
import { shallowEqual } from 'recompose'

const SECONDARY = { main: '#FF5555' }
export const TYPE_LIGHT = 'light'

export function createLightTheme() {
    return createTheme(createLightPalette())
}

export function createTheme({ type, primary, secondary }) {
    return createMuiTheme({
        palette: {
            type,
            primary,
            secondary: secondary || SECONDARY,
        },
    })
}

export function createPalette({ type, primary }) {
    return {
        type,
        primary,
        secondary: SECONDARY,
    }
}

export function createLightPalette() {
    return createPalette({
        type: TYPE_LIGHT,
        primary: blue,
    })
}

class ThemeWrapper extends React.Component {
    constructor(props) {
        super(props)

        const { palette } = this.props

        this.state = {
            theme: createMuiTheme({ palette }),
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!shallowEqual(this.props.palette, nextProps.palette))
            this.setState({ theme: createMuiTheme({ palette: nextProps.palette }) })
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.theme !== this.state.theme) {
            return true
        }

        if (nextProps.children !== this.props.children) {
            return true
        }

        return false
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState)
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState)
    }

    onUpdateAuthorizationState = update => {
        const { palette, prevPalette } = this.props

        switch (update.authorization_state['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitCode':
            case 'authorizationStateWaitPassword':
                const lightPalette = createLightPalette()
                if (!shallowEqual(lightPalette, palette)) {
                    this.props.setPalette(lightPalette)
                }
                break
            default:
                if (prevPalette && !shallowEqual(prevPalette, palette)) {
                    this.props.setPalette(prevPalette, prevPalette)
                }
        }
    }

    render() {
        const { theme } = this.state
        const { children } = this.props

        return <ThemeProvider theme={theme}>{children}</ThemeProvider>
    }
}

ThemeWrapper.propTypes = {
    palette: PropTypes.object.isRequired,
    prevPalette: PropTypes.object,
    setPalette: PropTypes.func.isRequired,
}

const mapStateToProps = state => {
    return {
        palette: state.palette.current,
        prevPalette: state.palette.prev,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setPalette: (palette, prevPalette = null) => dispatch(setPalette(palette, prevPalette)),
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ThemeWrapper)
