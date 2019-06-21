/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import TelegramApp from './TelegramApp'
import registerServiceWorker from './registerServiceWorker'
import Cookies from 'universal-cookie'
import { OPTIMIZATIONS_FIRST_START } from './Constants'
import './index.css'
import createReduxStore from './Stores/ReduxStore/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import StylesProvider from '@material-ui/styles/StylesProvider'
import Theme from './Theme'

const { store: reduxStore, persistor: reduxPersistor } = createReduxStore()

ReactDOM.render(
    <StylesProvider injectFirst={false}>
        <Provider store={reduxStore}>
            <PersistGate loading={null} persistor={reduxPersistor}>
                <Theme>
                    <Router>
                        <Route path='' component={TelegramApp} />
                    </Router>
                </Theme>
            </PersistGate>
        </Provider>
    </StylesProvider>,
    document.getElementById('root')
)

if (OPTIMIZATIONS_FIRST_START) {
    const cookieEnabled = navigator.cookieEnabled
    if (cookieEnabled) {
        const cookies = new Cookies()
        const register = cookies.get('register')
        if (register) {
            registerServiceWorker()
        }
    } else {
        registerServiceWorker()
    }
} else {
    registerServiceWorker()
}
