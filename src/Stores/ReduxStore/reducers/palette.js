import { SET_PALETTE } from '../actions'
import blue from '@material-ui/core/colors/blue'
import { createLightPalette, TYPE_LIGHT, createPalette } from '../../../Theme'
import { shallowEqual } from 'recompose'
import Cookies from 'universal-cookie'

function getInitialState() {
    const cookies = new Cookies()
    const { type, primary } = cookies.get('themeOptions') || { type: TYPE_LIGHT, primary: blue }

    const palette = createPalette({
        type,
        primary,
    })

    return {
        current: palette,
        prev: null,
    }
}

const initialState = getInitialState()

export default function palette(state = initialState, action) {
    switch (action.type) {
        case SET_PALETTE:
            if (shallowEqual(action.palette, state.current)) {
                return state
            }

            return {
                prev: action.prevPalette ? action.prevPalette : { ...state.current },
                current: action.palette,
            }
    }

    return state
}
