import { SET_IS_ACTIVE_STICKERS_PICKER } from '../actions'

const initialState = {
    isActive: false,
}

export default function stickersPicker(state = initialState, action) {
    switch (action.type) {
        case SET_IS_ACTIVE_STICKERS_PICKER:
            return { ...state, isActive: action.isActive }
    }

    return state
}
