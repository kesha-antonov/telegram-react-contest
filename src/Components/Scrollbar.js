import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import 'react-perfect-scrollbar/dist/css/styles.css'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { connect } from 'react-redux'

function Scrollbar(props) {
    console.log('Scrollbar', props)
    const isDarkTheme = props.theme.palette.type === 'dark'

    return (
        <PerfectScrollbar
            {...props}
            className={classNames(
                'dialogs-list',
                {
                    ['scrollbar-light']: !isDarkTheme,
                    ['scrollbar-dark']: isDarkTheme,
                },
                props.className
            )}>
            {props.children}
        </PerfectScrollbar>
    )
}

Scrollbar.propTypes = {
    theme: PropTypes.object.isRequired,
    children: PropTypes.any,
}

const mapStateToProps = state => {
    return {
        theme: state.theme.current,
    }
}

export default connect(mapStateToProps)(Scrollbar)
