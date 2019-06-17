/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import blue from '@material-ui/core/colors/blue';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import StylesProvider from '@material-ui/styles/StylesProvider';
import { getDisplayName } from './Utils/HOC';
import Cookies from 'universal-cookie';
import ApplicationStore from './Stores/ApplicationStore';

const SECONDARY = { main: '#FF5555' };
const TYPE_LIGHT = 'light';

function createLightTheme() {
    return createMuiTheme({
        palette: {
            type: TYPE_LIGHT,
            primary: blue,
            secondary: SECONDARY
        }
    });
}

export default function withTheme(WrappedComponent) {
    class ThemeWrapper extends React.Component {
        constructor(props) {
            super(props);

            const cookies = new Cookies();
            const { type, primary } = cookies.get('themeOptions') || { type: TYPE_LIGHT, primary: blue };

            let theme = createMuiTheme({
                palette: {
                    type,
                    primary,
                    secondary: SECONDARY
                }
            });

            this.state = {
                prevTheme: theme,
                theme
            };
        }

        componentDidMount() {
            ApplicationStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
            ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        }

        componentWillUnmount() {
            ApplicationStore.removeListener('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
            ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
        }

        onClientUpdateThemeChanging = update => {
            const { type, primary } = update;

            const theme = createMuiTheme({
                palette: {
                    type,
                    primary,
                    secondary: SECONDARY
                }
            });

            const cookies = new Cookies();
            cookies.set('themeOptions', { type, primary });

            this.setState({ theme }, () => ApplicationStore.emit('clientUpdateThemeChange'));
        };

        onUpdateAuthorizationState = update => {
            switch (update.authorization_state['@type']) {
                case 'authorizationStateWaitPhoneNumber':
                case 'authorizationStateWaitCode':
                case 'authorizationStateWaitPassword':
                    this.setState({
                        prevTheme: this.state.theme,
                        theme: createLightTheme()
                    });
                    break;
                default:
                    if (this.state.prevTheme && this.state.theme.type !== this.state.prevTheme.type) {
                        this.setState({
                            theme: this.state.prevTheme
                        });
                    }
            }
        };

        render() {
            const { theme } = this.state;

            return (
                <StylesProvider injectFirst>
                    <MuiThemeProvider theme={theme}>
                        <WrappedComponent {...this.props} />
                    </MuiThemeProvider>
                </StylesProvider>
            );
        }
    }
    ThemeWrapper.displayName = `WithTheme(${getDisplayName(WrappedComponent)})`;

    return ThemeWrapper;
}
