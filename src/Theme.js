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
import Cookies from 'universal-cookie'
import ApplicationStore from './Stores/ApplicationStore'
import { setTheme } from './Stores/ReduxStore/actions'
import { connect } from 'react-redux'

const SECONDARY = { main: '#FF5555' }
const TYPE_LIGHT = 'light'

export function createLightTheme() {
    return createTheme({
        type: TYPE_LIGHT,
        primary: blue,
    })
}

export function createTheme({ type, primary }) {
    return createMuiTheme({
        palette: {
            type,
            primary,
            secondary: SECONDARY,
        },
    })
}

class ThemeWrapper extends React.Component {
    constructor(props) {
        super(props)

        const cookies = new Cookies()
        const { type, primary } = cookies.get('themeOptions') || { type: TYPE_LIGHT, primary: blue }

        let theme = createMuiTheme({
            palette: {
                type,
                primary,
                secondary: SECONDARY,
            },
        })

        if (this.props.theme.palette.type !== theme.palette.type) this.props.setTheme(theme)
    }

    shouldComponentUpdate(nextProps) {
        console.log('shouldComponentUpdate', this.props, nextProps)
        return nextProps !== this.props
    }

    componentDidMount() {
        // ApplicationStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging)
        // ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState)
    }

    componentWillUnmount() {
        // ApplicationStore.removeListener('clientUpdateThemeChanging', this.onClientUpdateThemeChanging)
        // ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState)
    }

    onUpdateAuthorizationState = update => {
        const { theme, prevTheme } = this.props

        switch (update.authorization_state['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitCode':
            case 'authorizationStateWaitPassword':
                if (theme.palette.type !== TYPE_LIGHT) this.props.setTheme(createLightTheme())
                break
            default:
                if (prevTheme && theme.palette.type !== prevTheme.palette.type) {
                    this.props.setTheme(prevTheme, prevTheme)
                }
        }
    }

    render() {
        const { theme, children } = this.props
        console.log('Theme theme', theme)

        return <ThemeProvider theme={theme}>{children}</ThemeProvider>
    }
}

ThemeWrapper.propTypes = {
    theme: PropTypes.object.isRequired,
    prevTheme: PropTypes.object,
    setTheme: PropTypes.func.isRequired,
}

const mapStateToProps = state => {
    return {
        theme: state.theme.current,
        prevTheme: state.theme.prev,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setTheme: (theme, prevTheme = null) => dispatch(setTheme(theme, prevTheme)),
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ThemeWrapper)
