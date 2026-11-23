import React, { useState, useEffect } from "react";
import { 
  Tldraw, 
  TldrawUiIcon,
  TLComponents, 
  TLShape,
  DefaultPageMenu, 
  useEditor,
  DefaultToolbar,
  DefaultColorStyle,
	DefaultStylePanel,
	DefaultStylePanelContent,
	TLUiStylePanelProps,
	TldrawUiButton,
	TldrawUiButtonLabel,
	useRelevantStyles,
  TLUiContextMenuProps,
  DefaultContextMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  DefaultContextMenuContent,
} from "tldraw";
import 'tldraw/tldraw.css';
import '../Space2Think/style.css';
import { current } from "../LexicalEditor/time";
import { logger } from '../../utils/logger.js';
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/store.js";
import { setPreSelectedShape } from "../LexicalEditor/slices/SpaceSlice.js";

function CustomToolbar() {
	return (
			<DefaultToolbar />
	)
}

function UseMyEditor(){
  const editor = useEditor();
  // Any additional logic involving 'editor'
  return editor;
}

function isSelectionWrappedByTagName(tagName) {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let commonAncestor = range.commonAncestorContainer as Node;

      // Ensure the common ancestor is an element if it's not (e.g., it's text node), use its parent
      if (commonAncestor && commonAncestor.nodeType !== 1) {
          commonAncestor = commonAncestor.parentNode as Node;
      }

      // Check if the common ancestor is the desired tag or has an ancestor that is
      while (commonAncestor != null && commonAncestor.nodeType === 1) {
        const element = commonAncestor as HTMLElement;
        if (element.tagName && element.tagName.toLowerCase() === tagName.toLowerCase()) {
              return true;
          }
          commonAncestor = commonAncestor.parentNode as Node;
      }
  }
  return false;
}
     
function GetDivBySelectedText(className: string) {
  // get the selected text
  const selection = window.getSelection();
  const selectedId = '';
  // get the shape id of the shape with the selected text
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let commonAncestor = range.commonAncestorContainer;    
    
    // Ensure the common ancestor is an element if it's not (e.g., it's a text node), use its parent
    if (commonAncestor.nodeType === 3) {
      return commonAncestor;
    }
    console.log(`[${current()}]`+ "[Menus] commonAncestor2", commonAncestor);
  }
  return null;
}


async function updateShapeWithHighlight(editor, text: string, add: boolean, documentId: string[]) {
  const snapshot = editor.store.getSnapshot();
  // const onlySelectedShape = editor.getOnlySelectedShape();
  await logger.logUserAction("[Menus] manual highlight", {details: text});

  // console.log(`[${current()}]`+ "[Menus] updateShapeWithHighlight documentId", documentId);
  if (documentId){
    let highlightText = "";
    Object.keys(snapshot.store).forEach(item => {
      if (snapshot.store[item].type === "xx_html" && snapshot.store[item].props.label === documentId){
        const shape = snapshot.store[item];
        const id = shape.id;
        const type = shape.type;
        const props = shape.props;

        const highlights = [...props.highlight];
        console.log(`[${current()}]`+ "[Menus] highlights", highlights);
        console.log(`[${current()}]`+ "[Menus] highlights text", text.trim().replace(/^[.,\s]+|[.,\s]+$/g, ''))
        const trimText = text.trim().replace(/^[.,\s]+|[.,\s]+$/g, ''); 
        const regex = new RegExp(`\\b${trimText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(props.content)){
          highlightText = trimText;
          // const trimText = text.trim();
          if (add && highlights.includes(highlightText) === false) {
            highlights.push(highlightText);
          } else {
            for (let i = 0; i < highlights.length; i++) {
              if (highlights[i].includes(trimText))  {
                highlights.splice(i, 1);
                break;
              }
            }
          }
          console.log(`[${current()}]`+ "[Menus] updateShapeWithHighlight highlights", highlights);

          editor.updateShape({
            id,
            type,
            props: {
              ...props,
              highlight: highlights,
            },
          })
        }
        
      }
    })
      
    // Object.keys(snapshot.store).forEach(item => {
    //   if (snapshot.store[item].type === "xx_html") {
    //     const shape = snapshot.store[item];
    //     const id = shape.id;
    //     const type = shape.type;
    //     const props = shape.props;
    //     const highlights = [...(props.highlight || [])];
    //     if (!highlights.includes(highlightText) && props.content.includes(highlightText)){
    //       highlights.push(highlightText);
    //       editor.updateShape({
    //         id,
    //         type,
    //         props: {
    //           ...props,
    //           highlight: highlights,
    //         },
    //       })
    //     }
         
    //   }
    // });
      
    }
  // }

    

  }

async function adoptLLMHighlight(editor, text: string) {
  // Get the store snapshot
  const snapshot = editor.store.getSnapshot();
  const onlySelectedShape = editor.getOnlySelectedShape();
  const fullText = GetDivBySelectedText(text)?.textContent;
  await logger.logUserAction("[Menus] adoptLLMHighlight", {details: fullText});

  if (fullText !== null){
  
    // Process each shape in the store
    Object.keys(snapshot.store).forEach(item => {
        if (snapshot.store[item].type === "xx_html") {
        const shape = snapshot.store[item];
        const id = shape.id;
        const type = shape.type;
        const props = shape.props;

        if (props.content.includes(fullText)){
          console.log(`[${current()}]`+ "[Menus] fullText", fullText)

          // Get the current highlights
          const commonhl = [...(props.commonhl || [])];
          const llmhl = [...(props.llmhighlight || [])];

          commonhl.push(fullText);
          const index = llmhl.indexOf(fullText);
          if (index > -1) {
            llmhl.splice(index, 1);
          }
          
          // Update the shape with new highlight arrays
          editor.updateShape({
            id,
            type,
            props: {
              ...props,
              commonhl: commonhl,
              llmhighlight: llmhl,
            },
          });
      }
      }
    });
    console.log(`[${current()}]`+ "[Menus] Adopt LLM Highlight snapshot", editor.store.getSnapshot().store);

    console.log(`[${current()}]`+ "[Menus] Processed all xx_html shapes for LLM highlights");
  }
}

async function abandonLLMHighlight(editor, text: string) {
  const snapshot = editor.store.getSnapshot();
  const onlySelectedShape = editor.getOnlySelectedShape();
  const fullText = GetDivBySelectedText(text)?.textContent;
  await logger.logUserAction("[Menus] abandonLLMHighlight", {details: fullText});

  // const parent
  if (fullText !== null){
    for (const item of Object.keys(snapshot.store)) {
      if (snapshot.store[item].type === "xx_html") {
        const shape = snapshot.store[item];
        const id = shape.id;
        const type = shape.type;
        const props = shape.props;

        if (props.content.includes(fullText)){
          console.log(`[${current()}]`+ "[Menus] fullText", fullText)

          // Get the current highlights
          const omithl = [...(props.omithl || [])];
          const llmhl = [...(props.llmhighlight || [])];

          omithl.push(fullText);
          const index = llmhl.indexOf(fullText);
            if (index > -1) {
              llmhl.splice(index, 1);
            }

          editor.updateShape(
            {
              id, // required
              type, // required
              props: {
                ...props,
                llmhighlight: llmhl,
                omithl: omithl,
              },
            },
          )
        }
      }
    }
  }
}

async function cancelCombinedHighlight(editor, text: string) {
  const snapshot = editor.store.getSnapshot();
  const onlySelectedShape = editor.getOnlySelectedShape();
  const fullText = GetDivBySelectedText(text)?.textContent;
  await logger.logUserAction("[Menus] cancelCombinedHighlight", {details: fullText});

  // const parent
  if (fullText !== null){
    Object.keys(snapshot.store).forEach(item => {
      if (snapshot.store[item].type === "xx_html") {
        const shape = snapshot.store[item];
        const id = shape.id;
        const type = shape.type;
        const props = shape.props;

        console.log(`[${current()}]`+ "[Menus] props", props)

        if (props.content.includes(fullText)){

          const commonhl = [...props.commonhl];
          const omithl = [...props.omithl];

          omithl.push(fullText);

          const index2 = commonhl.indexOf(fullText);
            if (index2 > -1) {
              commonhl.splice(index2, 1);
            }

          editor.updateShape(
            {
              id, // required
              type, // required
              props: {
                ...props,
                commonhl: commonhl,
                omithl: omithl,
              },
            },
          )
        }
      }
    });
  }
}

async function cancelOmitHighlight(editor, text: string) {
  const snapshot = editor.store.getSnapshot();
  const onlySelectedShape = editor.getOnlySelectedShape();
  const fullText = GetDivBySelectedText(text)?.textContent;
  await logger.logUserAction("[Menus] cancelOmitHighlight", {details: fullText});
  // const parent
  if (onlySelectedShape && fullText !== null){
    Object.keys(snapshot.store).forEach(item => {
      if (snapshot.store[item].type === "xx_html") {
        const shape = snapshot.store[item];
        const id = shape.id;
        const type = shape.type;
        const props = shape.props;
       
        console.log(`[${current()}]`+ "[Menus] props", props)

        const omithl = [...props.omithl];

        if (omithl.includes(fullText)){

          const index = omithl.indexOf(fullText);
            if (index > -1) {
              omithl.splice(index, 1);
            }

          editor.updateShape(
            {
              id, // required
              type, // required
              props: {
                ...props,
                omithl: omithl,
              },
            },
          )
        }
      }
    });
  }
}

function getDocumentContainerFromSelection() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let commonAncestor = range.commonAncestorContainer;
    
    // If it's a text node, get its parent element
    if (commonAncestor.nodeType === 3) {
      commonAncestor = commonAncestor.parentNode;
    }
    
    // Traverse up the DOM tree to find the document container
    let currentElement = commonAncestor as HTMLElement;
    while (currentElement && currentElement.nodeType === 1) {
      // Look for elements with class "doc_title" or containing document title
      if (currentElement.classList.contains('doc_title') || 
          currentElement.querySelector('.doc_title')) {
        // Found the document container
        const titleElement = currentElement.querySelector('.doc_title p');
        if (titleElement) {
          return {
            documentId: titleElement.textContent,
            container: currentElement
          };
        }
      }
      
      // Also check if this element itself contains the document structure
      if (currentElement.classList.contains('MuiBox-root') && 
          currentElement.querySelector('.doc_title')) {
        const titleElement = currentElement.querySelector('.doc_title p');
        if (titleElement) {
          return {
            documentId: titleElement.textContent,
            container: currentElement
          };
        }
      }
      
      currentElement = currentElement.parentElement;
    }
  }
  return null;
}

function CustomContextMenu(props: TLUiContextMenuProps) {
  const selectedText = window.getSelection()?.toString() ?? '';
  const isSelectedText = selectedText.length > 0 && selectedText.trim() !== '';
  const isSelectedTextInHighlight = isSelectionWrappedByTagName('highlight');
  const isSelectedTextInLLMHighlight = isSelectionWrappedByTagName('llmhighlight');
  const isSelectedTextInCombHl = isSelectionWrappedByTagName('commonhl');
  const isSelectedTextInOmitHl = isSelectionWrappedByTagName('omithl');
  const [preSelectedShape, setPreSelectedShape] = useState([]);
  const documentInfo = getDocumentContainerFromSelection();

  // const isSelectionWrappedByTag = doesSelectionWrappedByTagName(['llmhighlight', 'commonhl', 'omithl']);
  const editor = useEditor();
  // console.log("editor", editor.getSelectedShapeIds())
  // const [isSelectedShape, setIsSelectedShape] = useState(editor.getSelectedShapeIds().length > 0);
  // const shapeId = editor.getSelectedShapeIds()[0];
  // const preSelectedShape = useSelector((state: RootState) => state.space.preSelectedShape);
  // console.log(`[${current()}]`+ "[Menus] preSelectedShape", preSelectedShape);
  // useEffect(() => {
  //   const selectedShapeIds = editor.getSelectedShapeIds();
  //   console.log(`[${current()}]`+ "[Menus] selectedShapeIds", selectedShapeIds);
  // }, [editor.getSelectedShapeIds()]);

  useEffect(() => {
    if (documentInfo){
        const documentId = documentInfo.documentId;
        // console.log(`[${current()}]`+ "[Menus] documentId", documentId);
        if (documentId){
            setPreSelectedShape(documentId);
            // console.log(`[${current()}]`+ "[Menus] preSelectedShape", preSelectedShape);
        }
        else{
            setPreSelectedShape([]);
        }
    }
}, [documentInfo]);

	return (
		<DefaultContextMenu {...props}>
			<TldrawUiMenuGroup id="highlight">
				<TldrawUiMenuItem
					id="highlight"
					label="Highlight"
					icon="highlight"
          // disabled={(!isSelectedText || isSelectedTextInHighlight || !isSelectedShape || isSelectedTextInLLMHighlight || isSelectedTextInCombHl || isSelectedTextInOmitHl)}
          disabled={(!isSelectedText || isSelectedTextInHighlight || isSelectedTextInLLMHighlight || isSelectedTextInCombHl || isSelectedTextInOmitHl)}
          // readonlyOk
					onSelect={() => {
            updateShapeWithHighlight(editor, selectedText, true, preSelectedShape);
            console.log(`[${current()}]`+ "[Menus] highlight", selectedText);
					}}
				/>
        <TldrawUiMenuItem
					id="clhighlight"
					label="Cancel highlight"
					icon="Cancel highlight"
          disabled={!isSelectedText || !isSelectedTextInHighlight || isSelectedTextInCombHl || isSelectedTextInOmitHl}
					// readonlyOk
					onSelect={() => {
            updateShapeWithHighlight(editor, selectedText, false, preSelectedShape);
            console.log(`[${current()}]`+ "[Menus] cancel highlight", selectedText);
					}}
				/>
        <TldrawUiMenuItem
					id="adopt"
					label="Adopt LLM highlight"
					icon="Adopt"
          disabled={!isSelectedText || !isSelectedTextInLLMHighlight || isSelectedTextInCombHl || isSelectedTextInOmitHl}
					// readonlyOk
					onSelect={() => {
            adoptLLMHighlight(editor, selectedText);
            console.log(`[${current()}]`+ "[Menus] adopt LLM highlight", selectedText);
					}}
				/>
        <TldrawUiMenuItem
					id="abandon"
					label="Abandon LLM highlight"
					icon="Abandon"
          disabled={!isSelectedText || !isSelectedTextInLLMHighlight || isSelectedTextInCombHl || isSelectedTextInOmitHl}
					// readonlyOk
					onSelect={() => {
            abandonLLMHighlight(editor, selectedText);
            console.log(`[${current()}]`+ "[Menus] abandon LLM highlight", selectedText);
					}}
				/>
        <TldrawUiMenuItem
					id="clhighlight2"
					label="Cancel highlight"
					icon="Cancel highlight"
          disabled={!isSelectedText || !isSelectedTextInCombHl || isSelectedTextInOmitHl}
					// readonlyOk
					onSelect={() => {
            console.log(`[${current()}]`+ "[Menus] cancel combined highlight", selectedText);
            cancelCombinedHighlight(editor, selectedText);
					}}
				/>
        <TldrawUiMenuItem
					id="cllinethrough"
					label="Cancel anti-highlight"
					icon="Cancel anti-highlight"
          disabled={!isSelectedText || !isSelectedTextInOmitHl}
					// readonlyOk
					onSelect={() => {
            console.log(`[${current()}]`+ "[Menus] cancel line through", selectedText);
            cancelOmitHighlight(editor, selectedText);
					}}
				/>
			</TldrawUiMenuGroup>
		</DefaultContextMenu>
	)
}

function CustomStylePanel(props: TLUiStylePanelProps) {
	const editor = useEditor()

	// Styles are complex, sorry. Check our DefaultStylePanel for an example.

	const styles = useRelevantStyles()
  const selectedText = window.getSelection()?.toString() ?? '';
  const isSelectedText = selectedText.length > 0 && selectedText.trim() !== '';
  const isSelectedTextInHighlight = isSelectionWrappedByTagName('highlight');
  const isSelectedTextInLLMHighlight = isSelectionWrappedByTagName('llmhighlight');
  const isSelectedTextInCombHl = isSelectionWrappedByTagName('commonhl');
  const isSelectedTextInOmitHl = isSelectionWrappedByTagName('omithl');
  const isSelectedShape = editor.getSelectedShapeIds().length > 0;
  const shapeId = editor.getSelectedShapeIds()[0];

	return (
		<DefaultStylePanel {...props}>
      <div id="highlight_tip" style={{display: "block"}}>
        <div style={{padding: "0.5em", borderRadius: "0.25em"}}>
          <div style={{textAlign: "center", fontSize:"large"}}><b>Highlights:</b></div>
        </div>
        <div style={{padding: "0.5em", borderRadius: "0.25em", opacity: "0.7"}}>
          <div style={{textAlign: "center"}}><b style={{backgroundColor: "#fcfc03"}}>User</b> highlights</div>
        </div>
        <div style={{padding: "0.5em", borderRadius: "0.25em", opacity: "0.7"}}>
        <div style={{textAlign: "center"}}><b style={{backgroundColor: "#5bc8f3"}}>
          LLM</b> highlights</div>
        </div>
        <div style={{padding: "0.5em", borderRadius: "0.25em", opacity: "0.7"}}>
        <div style={{textAlign: "center"}}><b style={{backgroundColor: "#4afd65"}}>
          Common</b> highlights</div>
        </div>
        <div style={{padding: "0.5em", borderRadius: "0.25em", opacity: "0.7"}}>
        <div style={{textAlign: "center"}}><b style={{backgroundColor: "#dddbdb",textDecorationLine: "line-through"}}>
          Omit</b> highlights</div>
        </div>
      </div>
		</DefaultStylePanel>
	)
}

const MenuComponents: TLComponents = {
	PageMenu: null, // null will hide the page menu instead
  Toolbar: null,
  DebugMenu: null,
  // StylePanel: null, // null will hide the panel instead
  // Toolbar: CustomToolbar,
  // StylePanel: CustomStylePanel, // null will hide the panel instead
  StylePanel: null,
  ContextMenu: CustomContextMenu
}


export default MenuComponents;