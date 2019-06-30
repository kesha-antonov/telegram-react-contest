import React from 'react'
import './ChatTextPlaceholder.css'
import classNames from 'classnames'
import makeStyles from '@material-ui/core/styles/makeStyles'

const useStyles = makeStyles(theme => ({
    text: {
        color: theme.palette.text.hint,
    },
}))

function ChatTextPlaceholder({ text }) {
    const classes = useStyles()

    return (
        <div className={classNames(classes.text, 'chat-text-placeholder')}>
            <span>{text}</span>
        </div>
    )
}

export default ChatTextPlaceholder
