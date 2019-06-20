import { SET_THEME } from '../actions'
import { createLightTheme } from '../../../Theme'

const initialState = {
    current: createLightTheme(),
    prev: null,
}

export default function theme(state = initialState, action) {
    switch (action.type) {
        case SET_THEME:
            return {
                prev: action.prevTheme ? action.prevTheme : { ...state.current },
                current: action.theme,
            }
    }

    return state
}
