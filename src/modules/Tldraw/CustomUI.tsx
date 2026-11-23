import React from "react";
import { useEffect } from 'react'
import { Tldraw, track, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import './custom-ui.css'
import {Box, Button, Stack, Typography, Tooltip} from '@mui/material';
import BackHandOutlinedIcon from '@mui/icons-material/BackHandOutlined';
import CallMadeOutlinedIcon from '@mui/icons-material/CallMadeOutlined';
import NorthWestIcon from '@mui/icons-material/NorthWest';
import CropFreeIcon from '@mui/icons-material/CropFree';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BackspaceIcon from '@mui/icons-material/Backspace';
import { current } from "../LexicalEditor/time";
import { logger } from "../../utils/logger";

const CustomUi = track(() => {
	const editor = useEditor()
    // console.log("uieditor", editor)

	useEffect(() => {
		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'Delete': break;
				case 'Backspace': {
					// editor.deleteShapes(editor.getSelectedShapeIds())
					break
				}
                case 'p': break; 
                // editor.setCurrentTool('hand'); break;
                case 's': break; 
                // editor.setCurrentTool('select'); break;
                case 'x': break;
				case 'p': break;
				case 'b': break;
                case 'a': break;
                case 'f': break;
                case 'n': break;
                case 'e': break; 
                case 'd': break;
                case 'i': break;
                case 'o': break;
                case 's': break;
                case 't': break;
                case 'u': break;
                case 'v': break;
                case 'w': break;
                case 'y': break;
                case 'z': break;
                case 'ArrowUp': break;
                case 'ArrowDown': break;
                case 'ArrowLeft': break;
                case 'ArrowRight': break;
                case 'Enter': break;
                case 'Escape': break;
                case 'Tab': break;
                case 'Shift': break;

			}
		}

		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keyup', handleKeyUp)
		}
	})

	return (
		<div className="custom-layout">
			<div className="custom-toolbar">
                <Tooltip title='Select' placement='bottom'>
                    <button
                        className="custom-button"
                        data-isactive={editor.getCurrentToolId() === 'select'}
                        onClick={() => {
                            editor.setCurrentTool('select');
                            logger.info('TldrawCustomUI', 'tool_selected', { tool: 'select' });
                            
                        }}
                    >
                        <NorthWestIcon />
                    </button>
                </Tooltip>
                <Tooltip title='Pan' placement='bottom'>
                    <button
                    className="custom-button"
                    aria-label="PanTool"
                    data-isactive={editor.getCurrentToolId() === 'hand'}
                    onClick={() => {
                        editor.setCurrentTool('hand')
                        logger.info('TldrawCustomUI', 'tool_selected', { tool: 'hand' });
                    }}
                    >
                    <BackHandOutlinedIcon />
                    </button>
                </Tooltip> 
                {/* <Tooltip title='Arrow' placement='bottom'>
                   <button
                        className="custom-button"
                        data-isactive={editor.getCurrentToolId() === 'arrow'}
                        onClick={() => {
                            editor.setCurrentTool('arrow');
                            logger.info('TldrawCustomUI', 'tool_selected', { tool: 'arrow' });
                        }}                  >
                        <CallMadeOutlinedIcon />
                    </button>*/}
                {/* </Tooltip> */}
                <Tooltip title='Frame' placement='bottom'>
                    <button
                        className="custom-button"
                        data-isactive={editor.getCurrentToolId() === 'frame'}
                        onClick={() => {
                            editor.setCurrentTool('frame');
                            logger.info('TldrawCustomUI', 'tool_selected', { tool: 'frame' });
                        }}
                    >
                        <CropFreeIcon />
                        {/* Frame */}
                    </button>
                </Tooltip>
                <Tooltip title='Note' placement='bottom'>
                    <button
                        className="custom-button"
                        data-isactive={editor.getCurrentToolId() === 'note'}
                        onClick={() => {
                            editor.setCurrentTool('note')
                            logger.info('TldrawCustomUI', 'tool_selected', { tool: 'note' });
                        }}
                    >
                        <EditNoteIcon />
                        {/* Note */}
                    </button>
                </Tooltip>
                <Tooltip title='Eraser' placement='bottom'>
                    <button
                        className="custom-button"
                        data-isactive={editor.getCurrentToolId() === 'eraser'}
                        onClick={() => {
                            editor.setCurrentTool('eraser')
                            logger.info('TldrawCustomUI', 'tool_selected', { tool: 'eraser' });
                        }}
                    >
                        <BackspaceIcon />
                        {/* Eraser */}
                    </button> 
                </Tooltip>
                
			</div>
		</div>
	)
})

export default CustomUi;