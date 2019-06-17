import React from 'react';
import './SelectChatPlaceholder.css';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    selectChatPlaceholder: {
        color: theme.palette.text.hint
    }
}));

function SelectChatPlaceholder() {
    const classes = useStyles();
    const [t] = useTranslation();

    return (
        <div className={classNames(classes.selectChatPlaceholder, 'select-chat-placeholder')}>
            <span>{t('SelectChatPlaceholder')}</span>
        </div>
    );
}

export default SelectChatPlaceholder;
