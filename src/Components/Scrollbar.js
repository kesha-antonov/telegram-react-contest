import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import 'react-perfect-scrollbar/dist/css/styles.css'
import './Scrollbar.css'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { connect } from 'react-redux'

const isTouchDevice =
    'ontouchstart' in document.documentElement ||
    'ontouchstart' in window ||
    window.navigator.msPointerEnabled

function Scrollbar(props) {
    if (isTouchDevice) {
        return (
            <div
                {...props}
                className={classNames(props.className, 'scrollbar-touch')}
                ref={props.containerRef}
                onScroll={props.onScrollY}>
                {props.children}
            </div>
        )
    }

    const isLightTheme = props.palette.type === 'light'

    return (
        <PerfectScrollbar
            {...props}
            className={classNames(
                {
                    ['scrollbar-light']: isLightTheme,
                    ['scrollbar-dark']: !isLightTheme,
                },
                props.className
            )}>
            {props.children}
        </PerfectScrollbar>
    )
}

Scrollbar.propTypes = {
    palette: PropTypes.object.isRequired,
    children: PropTypes.any,
    containerRef: PropTypes.func,
    onScrollY: PropTypes.func,
}

const mapStateToProps = state => {
    return {
        palette: state.palette.current,
    }
}

export default connect(mapStateToProps)(Scrollbar)
