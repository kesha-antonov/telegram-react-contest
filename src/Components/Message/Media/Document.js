/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import PropTypes from 'prop-types'
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import DocumentTile from '../../Tile/DocumentTile'
import DocumentAction from './DocumentAction'
import { getExtension } from '../../../Utils/File'
import './Document.css'

class Document extends React.Component {
    render() {
        const { document, openMedia } = this.props
        if (!document) return null

        const { thumbnail, file_name } = document
        const file = document.document

        return (
            <div className='document'>
                <DocumentTile
                    thumbnail={thumbnail}
                    file={file}
                    openMedia={openMedia}
                    icon={<ArrowDownwardIcon />}
                    completeIcon={<InsertDriveFileIcon />}
                />
                <div className='document-content'>
                    <div className='document-title'>
                        <a
                            className='document-name'
                            onClick={openMedia}
                            title={file_name}
                            data-name={file_name}
                            data-ext={'.' + getExtension(file_name)}>
                            {file_name}
                        </a>
                    </div>
                    <DocumentAction file={file} />
                </div>
            </div>
        )
    }
}

Document.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    document: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
}

export default Document
