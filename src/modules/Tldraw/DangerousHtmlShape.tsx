import React from "react";
import {
	Geometry2d,
	HTMLContainer,
	Rectangle2d,
	ShapeProps,
	ShapeUtil,
	T,
	TLBaseShape,
	TLOnResizeHandler,
	Tldraw,
	resizeBox,
    BaseBoxShapeUtil,
	useIsEditing,
	TLOnDoubleClickHandleHandler,
	TLOnEditEndHandler,
	stopEventPropagation
} from 'tldraw'
import {
	Box,
	Typography,
	Avatar,
	Stack,
	Grid,
	IconButton,
	Tooltip,
	TextField,
	ListItemButtonProps,
	Button
  } from '@mui/material'
import HighlightIcon from '@mui/icons-material/Highlight'
import 'tldraw/tldraw.css'
import './custom-ui.css'
import {
    useDispatch,
    useSelector
} from 'react-redux';
import {
    setHighlightDoc
} from '../LexicalEditor/slices/SpaceSlice.js'
import { current } from '../LexicalEditor/time.js';

type IDangerousHtmlShape = TLBaseShape<
	'xx_html',
	{
		w: number
		h: number
		label: string
		title: string
		content: string
		highlight: Array<string>
		llmhighlight: Array<string>
		commonhl: Array<string>
		omithl: Array<string>
		selectedhl: Array<string>
		searchhl: Array<string>
		// editing: boolean
	}
>

function highlightText(content, highlights, llmhighlights, commonhls, omithls, selectedhls, searchhls, shape) {
	let updatedContent = content;
	let unmatchedHighlights: string[] = [];
	let matchedHighlights: string[] = [];
  
	// Iterate through each string in the highlights array
	// highlights.forEach((highlight) => {
	//   // Use a regular expression to find all instances of the highlight text
	//   // We use word boundaries (\b) to match only complete words, and 'gi' for global and case-insensitive matching
	//   const regex = new RegExp(`\\b${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
	//   // Replace each instance with the wrapped version in a highlight tag
	//   updatedContent = updatedContent.replace(regex, `<highlight style='user-select: text'>${highlight}</highlight>`);
	// });
	highlights.forEach((highlight) => {
			  // Use a regular expression to find all instances of the highlight text
	  // We use 'gi' for global and case-insensitive matching
	  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	  const regex = new RegExp(`${escapedHighlight}`, 'gi');
	  const beforeReplace = updatedContent;

	  // Replace each instance with the wrapped version in a highlight tag
	  updatedContent = updatedContent.replace(regex, `<highlight style='user-select: text'>${highlight}</highlight>`);

	  if (beforeReplace === updatedContent) {
		unmatchedHighlights.push(highlight);
	  } else {
		matchedHighlights.push(highlight);
	  }
	});

		// Use a regular expression to find all instances of the highlight text
		// We use word boundaries (\b) to match only complete words, and 'gi' for global and case-insensitive matching
	// 	const escapedPhrase = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// 	const regex = new RegExp(escapedPhrase, 'g');
	// 	updatedContent = content.replace(regex, (match) => {
	// 		return `<highlight style='user-select: text'>${match}</highlight>`;
	// 	  });

	// 	// const regex = new RegExp(`\\b${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
		
	// 	// Check if the highlight exists in the content
	// 	// if (regex.test(content)) {
	// 	//   // Replace each instance with the wrapped version in a highlight tag
	// 	//   updatedContent = updatedContent.replace(regex, `<highlight style='user-select: text'>${highlight}</highlight>`);
	// 	//   matchedHighlights.push(highlight);
	// 	// } else {
	// 	//   unmatchedHighlights.push(highlight);
	// 	// }
	//   });
  
	//   // Log results for highlights only
	//   console.log('=== HIGHLIGHTS PROCESSING RESULTS ===');
	//   console.log('Matched highlights:', matchedHighlights);
	//   console.log('Unmatched highlights:', unmatchedHighlights);
	//   console.log('Updated content preview:', updatedContent.substring(0, 200) + '...');
	//   highlights = matchedHighlights;

	// Iterate through each string in the highlights array
	llmhighlights.forEach((llmhighlight) => {
		const regex = new RegExp(`\\b${llmhighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
		if (selectedhls !== null && selectedhls !== undefined && selectedhls.includes(llmhighlight)){
			updatedContent = updatedContent.replace(regex, (match) => `<llmhighlight style='user-select: text' class='selectedhl' onclick='console.log("I am clicked")'>${match}</llmhighlight>`);
		}
		else{
			updatedContent = updatedContent.replace(regex, (match) => `<llmhighlight style='user-select: text' onclick='console.log("I am clicked")'>${match}</llmhighlight>`);
		}
	});

	commonhls.forEach((commonhl) => {
		const regex = new RegExp(`\\b${commonhl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
		if (selectedhls !== null && selectedhls !== undefined && selectedhls.includes(commonhl)){
			updatedContent = updatedContent.replace(regex, (match) => `<commonhl style='user-select: text' class='selectedhl' >${match}</commonhl>`);
		}
		else{
			updatedContent = updatedContent.replace(regex, (match) => `<commonhl >${match}</commonhl>`);
		}
	  });

	omithls.forEach((omithl) => {
		const regex = new RegExp(`\\b${omithl}\\b`, 'gi');
		updatedContent = updatedContent.replace(regex, `<omithl style='user-select: text'>${omithl}</omithl>`);
	});

	// Handle search highlights - create overlay highlights that don't interfere with text
	searchhls.forEach((searchhl) => {
		const regex = new RegExp(`${searchhl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
		updatedContent = updatedContent.replace(regex, (match) => {
			return `<span class="search-highlight-wrapper searchhl" data-search-text="${searchhl}">${match}</span>`;
		});
	});

	return updatedContent;
  }

export class DangerousHtmlUtil extends ShapeUtil<IDangerousHtmlShape> {
	static override type = 'xx_html' as const

	override getDefaultProps() {
		return {
			type: 'xx_html',
			w: 400,
			h: 300,
			label: '',
			content: '',
			title: '',
			highlight: [], 
			llmhighlight: [],
			commonhl: [],
			omithl: [],
			selectedhl: [],
			searchhl: [],
			// editing: false,
		}
	}

    override canBind = () => true
	override canEdit = () => true
	override canResize = () => true
	override isAspectRatioLocked = () => false
	// override canScroll = () => true

	// component(shape: IDangerousHtmlShape) {
	// 	const isEditing = this.editor.getEditingShapeId() === shape.id;

	// 	return (
	// 		<HTMLContainer id={shape.id} className="doc_container"
	// 			onPointerDown={isEditing ? stopEventPropagation : undefined}
	// 			style={{ 
	// 				// pointerEvents: isEditing ? 'all' : 'none',
	// 				pointerEvents: "all",
	// 				overflow: 'auto',
	// 				backgroundColor: '#ffffff',
	// 				padding: '10px',
	// 				borderRadius: '15px',
	// 				boxShadow: '6px 6px 2px 1px rgba(100, 100, 100, 0.5)',
	// 				border: '.2px solid black',
	// 				position: 'relative',
					
	// 			}}>
	// 			{isEditing && (
	// 				<button 
	// 				style={{
	// 					position: 'absolute',
	// 					top: '5px',
	// 					right: '5px',
	// 					zIndex: 10,
	// 					// pointerEvents: 'all',
	// 				}}
	// 				onClick={(e) => {
	// 					console.log('Highlight button clicked');
	// 					// Get the currently selected text at the time of clicking
	// 					const selectedText = window.getSelection()?.toString() ?? '';
	// 					console.log('selectedText', selectedText);
						
	// 					// Check if there's actually selected text
	// 					if (!selectedText || selectedText.trim() === '') {
	// 						console.log('No text selected');
	// 						return;
	// 					}
						
	// 					e.stopPropagation();
	// 					const highlights = [...shape.props.highlight];
	// 					console.log(`[${current()}]`+ "[Menus] highlights text", selectedText.trim().replace(/^[.,\s]+|[.,\s]+$/g, ''))
	// 					const highlightText = selectedText.trim().replace(/^[.,\s]+|[.,\s]+$/g, '');
	// 					const trimText = selectedText.trim();
	// 					if (highlights.includes(highlightText) === false) {
	// 					highlights.push(highlightText);
	// 					} else {
	// 					for (let i = 0; i < highlights.length; i++) {
	// 						if (highlights[i].includes(trimText))  {
	// 						highlights.splice(i, 1);
	// 						break;
	// 						}
	// 					}

	// 					}
	// 					this.editor.updateShape(
	// 					{
	// 						id: shape.id, // required
	// 						type: shape.type, // required
	// 						props: {
	// 						...shape.props,
	// 						highlight: highlights,
	// 						},
	// 					},
	// 					)
	// 					// Add highlight functionality here
	// 				}}
	// 				// onPointerDown={(e) => {
	// 				// 	e.stopPropagation();
	// 				// 	console.log('Highlight button pointer down');
	// 				// }}
	// 				>Highlight</button>
	// 			)}
	// 			<Box>
	// 				<div className="doc_title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
	// 					<Typography variant='body1' style={{ fontSize: 20 }}>
	// 						{shape.props.label}
	// 					</Typography>
	// 				</div>
	// 				{shape.props.title && (
	// 					<div>
	// 						<Typography 
	// 							variant='h6' 
	// 							style={{ 
	// 								fontSize: 20, 
	// 								fontWeight: 'bold',
	// 								userSelect: 'none',
	// 								cursor: 'default'
	// 							}}>
	// 							{shape.props.title}
	// 						</Typography>
	// 					</div>
	// 					)}
	// 				<div 
	// 					className="nodrag"
	// 					dangerouslySetInnerHTML={{ __html: highlightText(shape.props.content, shape.props.highlight, shape.props.llmhighlight, shape.props.commonhl, shape.props.omithl, shape.props.selectedhl, shape.props.searchhl, shape)}} 
	// 					style={{
	// 						// cursor: 'text',
	// 						overflow: 'auto', 
	// 						fontSize: 'calc(13px + 0.1vw)', 
	// 						textAlign: 'left',
	// 						// pointerEvents: 'all',
	// 						fontFamily: 'Arial, Helvetica, sans-serif',
	// 						userSelect: isEditing? 'text':'none',
	// 					}}>
	// 				</div>
	// 			</Box>
	// 		</HTMLContainer>
	// 	)
	// }
	component(shape: IDangerousHtmlShape) {
		// const isEditing = useIsEditing(shape.id)
		return (
			<HTMLContainer id={shape.id} className="doc_container"
				style={{ 
					overflow: 'auto', 
					backgroundColor: '#ffffff', //'#ccfaff', 
					padding: '10px', 
					borderRadius: '15px', 
					boxShadow: '6px 6px 2px 1px rgba(100, 100, 100, 0.5)',
					border: '.2px solid black',
				}}>
				<Box>
					<div className="doc_title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography variant='body1' style={{ fontSize: 20 }}>
							{shape.props.label}
						</Typography>
					</div>
					{shape.props.title && (
						<div>
							<Typography 
								variant='h6' 
								style={{ 
									fontSize: 20, 
									fontWeight: 'bold',
									userSelect: 'none',
									cursor: 'default'
								}}>
								{shape.props.title}
							</Typography>
						</div>
					)}
					<div 
						className="nodrag inner_text"
						data-tldraw-prevent-canvas-pointer-events="true"
						dangerouslySetInnerHTML={{ __html: highlightText(shape.props.content, shape.props.highlight, shape.props.llmhighlight, shape.props.commonhl, shape.props.omithl, shape.props.selectedhl, shape.props.searchhl, shape)}} 
						style={{
							// cursor: 'text',
							overflow: 'auto', 
							fontSize: 'calc(13px + 0.1vw)', 
							textAlign: 'left',
							pointerEvents: 'all',
							fontFamily: 'Arial, Helvetica, sans-serif',
							userSelect: 'text',
							// userSelect: this.editor.getSelectedShapeIds().includes(shape.id)? 'text':'none',
						}}
						onPointerDown={(e) => {
							e.stopPropagation()
						}}>
					</div>
				</Box>
			</HTMLContainer>
		)
	}

	getGeometry(shape: IDangerousHtmlShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	indicator(shape: IDangerousHtmlShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}

	override onDoubleClick = (shape:IDangerousHtmlShape) => {
		console.log(`[${current()}]`+ '[DangerousHtml]Double click', shape.props.label)
		// if (this.editor.getZoomLevel() < 0.8) {
			this.editor.zoomToSelection();
		this.editor.setCursor({type: 'text', rotation: 0});
		// }else{
		// 	this.editor.centerOnPoint({x: shape.x, y: shape.y});
		// 	this.editor.setCursor({type: 'text', rotation: 0});
		// }
	}

	override onResize: TLOnResizeHandler<IDangerousHtmlShape> = (shape, info) => {
		return resizeBox(shape, info)
	}

	override onEditEnd = (shape: IDangerousHtmlShape)  => {
		// this.editor.setCursor({type: 'text', rotation: 0});
	}
	
}


// [3]
const customShape = [
    DangerousHtmlUtil
]

export default customShape;
