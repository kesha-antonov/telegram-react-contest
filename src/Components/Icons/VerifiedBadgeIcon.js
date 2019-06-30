import React from 'react'
import PropTypes from 'prop-types'
import CheckDecagramIcon from 'mdi-material-ui/CheckDecagram'
import blue from '@material-ui/core/colors/blue'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
    primary: {
        color: blue[400],
    },
}))

function VerifiedBadgeIcon(props) {
    const classes = useStyles()

    return (
        <CheckDecagramIcon
            {...props}
            color={props.color}
            classes={{
                colorPrimary: classes.primary,
                ...props.classes,
            }}
        />
    )
}

VerifiedBadgeIcon.propTypes = {
    color: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
}
VerifiedBadgeIcon.defaultProps = {
    color: 'primary',
    classes: {},
}

export default VerifiedBadgeIcon
