/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { createRef, Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { compose } from 'recompose'
import withStyles from '@material-ui/core/styles/withStyles'
import { withTranslation } from 'react-i18next'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon'
import StickerEmojiIcon from 'mdi-material-ui/StickerEmoji'
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon'
import { Picker as EmojiPicker } from 'emoji-mart'
import StickerPreview from './StickerPreview'
import StickersPicker from './StickersPicker'
import { loadStickerThumbnailContent, loadStickerSetContent } from '../../Utils/File'
import { EMOJI_PICKER_TIMEOUT_MS } from '../../Constants'
import ApplicationStore from '../../Stores/ApplicationStore'
import FileStore from '../../Stores/FileStore'
import LocalizationStore from '../../Stores/LocalizationStore'
import StickerStore from '../../Stores/StickerStore'
import { connect } from 'react-redux'
import { setIsActiveStickersPicker } from '../../Stores/ReduxStore/actions'
import TdLibController from '../../Controllers/TdLibController'
import './EmojiPickerButton.css'
import './emojiMart.css'

const isiOS = (function IIFE() {
    var iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
        'MacIntel',
    ]

    if (!!navigator.platform) {
        return iDevices.indexOf(navigator.platform) > -1
    }

    return /iPad|iPhone|iPod|Mac\sOS\sX/.test(navigator.userAgent) && !window.MSStream
})()

const styles = theme => ({
    iconButton: {
        margin: '8px 0px',
    },
    headerButton: {
        borderRadius: 0,
        flex: '50%',
    },
    headerButtonEmojis: {
        borderTopLeftRadius: 4,
    },
    headerButtonStickers: {
        borderTopRightRadius: 4,
    },
    pickerRoot: {
        zIndex: theme.zIndex.modal,
        width: 338,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[8],
        position: 'absolute',
        bottom: 80,
        display: 'none',
    },
    pickerRootOpened: {
        display: 'block',
    },
    pickerEmojisAndStickers: {
        overflowX: 'hidden',
    },
    stickerEmojiIcon: {
        transform: 'rotate(-20deg)',
    },
})

class EmojiPickerButton extends Component {
    constructor(props) {
        super(props)

        this.state = {
            open: false,
            pickerStyle: null,
        }

        this.emojiPickerRef = createRef()
        this.stickersPickerRef = createRef()
        this.pickerButtonRef = createRef()
    }

    componentDidMount() {
        LocalizationStore.on('clientUpdateLanguageChange', this.removePicker)
        StickerStore.on('updateInstalledStickerSets', this.onClientUpdateInstalledStickerSets)
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.theme !== this.props.theme) this.removePicker()
    }

    componentWillUnmount() {
        LocalizationStore.removeListener('clientUpdateLanguageChange', this.removePicker)
        StickerStore.removeListener(
            'updateInstalledStickerSets',
            this.onClientUpdateInstalledStickerSets
        )
    }

    removePicker = () => {
        this.picker = null
    }

    handleButtonMouseEnter = event => {
        this.buttonEnter = true
        setTimeout(() => {
            if (!this.buttonEnter) return

            this.updatePicker(true)
            this.loadStickerSets()
        }, EMOJI_PICKER_TIMEOUT_MS)
    }

    onClientUpdateInstalledStickerSets = async () => {
        if (!this.stickerSets) return

        await this.loadStickerSets(true)

        if (!this.stickersPicker) return
        const stickersPicker = this.stickersPickerRef.current
        await stickersPicker.loadContent(this.stickerSets, this.sets, true, true)
    }

    loadStickerSets = async (force = false) => {
        if (this.sets && !force) return

        if (this.loadStickerSetsPromise) {
            await this.loadStickerSetsPromise
            return
        }

        this.loadStickerSetsPromise = new Promise(async resolve => {
            this.stickerSets = await TdLibController.send({
                '@type': 'getInstalledStickerSets',
                is_masks: false,
            })

            const promises = []
            this.stickerSets.sets.forEach(x => {
                promises.push(
                    TdLibController.send({
                        '@type': 'getStickerSet',
                        set_id: x.id,
                    })
                )
            })

            this.sets = await Promise.all(promises)

            const node = this.stickersPickerRef.current

            const store = await FileStore.getStore()
            const previewSets = this.sets.slice(0, 5).reverse()
            previewSets.forEach(x => {
                loadStickerSetContent(store, x)
                node.loadedSets.set(x.id, x.id)
            })

            const previewStickers = this.sets.reduce((stickers, set) => {
                if (set.stickers.length > 0) {
                    stickers.push(set.stickers[0])
                }
                return stickers
            }, [])
            previewStickers.forEach(x => {
                loadStickerThumbnailContent(store, x)
            })

            this.loadStickerSetsPromise = null
            resolve()
        })
        await this.loadStickerSetsPromise
    }

    handleButtonMouseLeave = () => {
        this.buttonEnter = false
        setTimeout(() => {
            this.tryClosePicker()
        }, EMOJI_PICKER_TIMEOUT_MS)
    }

    tryClosePicker = () => {
        const { sticker } = this.state
        if (this.paperEnter || this.buttonEnter || sticker) return

        this.updatePicker(false)
    }

    handlePaperMouseEnter = () => {
        this.paperEnter = true
    }

    handlePaperMouseLeave = () => {
        this.paperEnter = false
        setTimeout(() => {
            this.tryClosePicker()
        }, EMOJI_PICKER_TIMEOUT_MS)
    }

    updatePicker = open => {
        let newState = { open }

        if (this.state.open === newState.open) return

        if (newState.open) {
            const bounds = this.pickerButtonRef.current.getBoundingClientRect()
            newState['pickerStyle'] = {
                left: bounds.left - 338 + bounds.width,
            }
        }

        this.setState(newState, async () => {
            if (!newState.open) return

            if (this.props.isActiveStickersPicker) {
                await this.loadStickerSets()
                this.tryLoadStickersPacks()
            }
            this.tryScrollToChosedStickerPack()
        })
    }

    tryScrollToChosedStickerPack = () => {
        const stickersPicker = this.stickersPickerRef.current
        if (!stickersPicker) return

        stickersPicker.tryScrollToChosedStickerPack()
    }

    openPicker = () => {
        this.updatePicker(true)
    }

    handleEmojiClick = () => {
        this.props.setIsActiveStickersPicker(false)
    }

    tryLoadStickersPacks = () => {
        const stickersPicker = this.stickersPickerRef.current
        if (!stickersPicker) return

        stickersPicker.loadContent(this.stickerSets, this.sets)
    }

    handleStickersClick = () => {
        this.tryLoadStickersPacks()

        const { isActiveStickersPicker, setIsActiveStickersPicker } = this.props

        if (isActiveStickersPicker) {
            const stickersPicker = this.stickersPickerRef.current
            stickersPicker.scrollTop()
            return
        }

        setIsActiveStickersPicker(true)
    }

    handleStickerSend = sticker => {
        if (!sticker) return

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSend',
            sticker,
        })

        this.updatePicker(false)
    }

    handleStickerPreview = sticker => {
        this.setState({ sticker })

        if (!sticker) {
            this.tryClosePicker()
        }
    }

    render() {
        const { classes, theme, t, isActiveStickersPicker } = this.props
        const { open, sticker, pickerStyle } = this.state

        if (open && !this.picker) {
            const i18n = {
                search: t('Search'),
                notfound: t('NotEmojiFound'),
                skintext: t('ChooseDefaultSkinTone'),
                categories: {
                    search: t('SearchResults'),
                    recent: t('Recent'),
                    people: t('SmileysPeople'),
                    nature: t('AnimalsNature'),
                    foods: t('FoodDrink'),
                    activity: t('Activity'),
                    places: t('TravelPlaces'),
                    objects: t('Objects'),
                    symbols: t('Symbols'),
                    flags: t('Flags'),
                    custom: t('Custom'),
                },
            }

            this.picker = (
                <EmojiPicker
                    ref={this.emojiPickerRef}
                    set='apple'
                    showPreview={false}
                    showSkinTones={false}
                    onSelect={this.props.onSelect}
                    color={theme.palette.primary.dark}
                    i18n={i18n}
                    style={{ width: 338, overflowX: 'hidden' }}
                    native={isiOS}
                />
            )

            this.stickersPicker = (
                <StickersPicker
                    ref={this.stickersPickerRef}
                    onSelect={this.handleStickerSend}
                    onPreview={this.handleStickerPreview}
                />
            )
        }

        return (
            <>
                <link
                    rel='stylesheet'
                    type='text/css'
                    href={
                        theme.palette.type === 'dark'
                            ? 'emoji-mart.dark.css'
                            : 'emoji-mart.light.css'
                    }
                />
                <IconButton
                    ref={this.pickerButtonRef}
                    className={classes.iconButton}
                    aria-label='Emoticon'
                    onClick={this.openPicker}
                    onMouseEnter={this.handleButtonMouseEnter}
                    onMouseLeave={this.handleButtonMouseLeave}>
                    <SpeedDialIcon
                        open={isActiveStickersPicker}
                        icon={<InsertEmoticonIcon />}
                        openIcon={<StickerEmojiIcon classes={{ root: classes.stickerEmojiIcon }} />}
                    />
                </IconButton>
                <div
                    className={classNames(classes.pickerRoot, { [classes.pickerRootOpened]: open })}
                    onMouseEnter={this.handlePaperMouseEnter}
                    onMouseLeave={this.handlePaperMouseLeave}
                    style={pickerStyle}>
                    <div className={classes.pickerEmojisAndStickers}>
                        <div className='emoji-picker-header'>
                            <Button
                                color={!isActiveStickersPicker ? 'primary' : 'default'}
                                className={classNames(
                                    classes.headerButton,
                                    classes.headerButtonEmojis
                                )}
                                onClick={this.handleEmojiClick}>
                                {t('Emoji')}
                            </Button>
                            <Button
                                color={isActiveStickersPicker ? 'primary' : 'default'}
                                className={classNames(
                                    classes.headerButton,
                                    classes.headerButtonStickers
                                )}
                                onClick={this.handleStickersClick}>
                                {t('Stickers')}
                            </Button>
                        </div>
                        <div
                            className={classNames('emoji-picker-content', {
                                'emoji-picker-content-stickers': isActiveStickersPicker,
                            })}>
                            {this.picker}
                            {this.stickersPicker}
                        </div>
                    </div>
                    <StickerPreview sticker={sticker} />
                </div>
            </>
        )
    }
}

EmojiPickerButton.propTypes = {
    theme: PropTypes.object.isRequired,
    isActiveStickersPicker: PropTypes.bool.isRequired,
    setIsActiveStickersPicker: PropTypes.func.isRequired,
}

const mapStateToProps = state => {
    return {
        isActiveStickersPicker: state.stickersPicker.isActive,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setIsActiveStickersPicker: isActive => dispatch(setIsActiveStickersPicker(isActive)),
    }
}

const enhance = compose(
    connect(
        mapStateToProps,
        mapDispatchToProps
    ),
    withStyles(styles, { withTheme: true }),
    withTranslation()
)

export default enhance(EmojiPickerButton)
