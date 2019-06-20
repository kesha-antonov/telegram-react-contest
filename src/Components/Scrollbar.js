import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import 'react-perfect-scrollbar/dist/css/styles.css'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { connect } from 'react-redux'

function Scrollbar(props) {
    console.log('Scrollbar', props)
    const isLightTheme = props.palette.type === 'light'

    return (
        <PerfectScrollbar
            {...props}
            className={classNames(
                'dialogs-list',
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
}

const mapStateToProps = state => {
    return {
        palette: state.palette.current,
    }
}

export default connect(mapStateToProps)(Scrollbar)
