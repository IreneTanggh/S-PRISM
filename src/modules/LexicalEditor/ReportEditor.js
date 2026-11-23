import React, { useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { NodeEventPlugin } from '@lexical/react/LexicalNodeEventPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import ToolbarPlugin from './plugins/ToolbarPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'
// import FloatingButtonPlugin from './plugins/FloatingButtonPlugin'
import ReportPlugin from './plugins/ReportPlugin'
import ModifierPlugin from './plugins/ModifierPlugin3'
import LinkBackPlugin from './plugins/LinkBackPlugin'
import EntityLinkPlugin from './plugins/EntityLinkPlugin'
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import MuiAppBar from '@mui/material/AppBar'
import Drawer from '@mui/material/Drawer'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
// import SaveModal from './widgets/SaveModal'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import { useLocation } from 'react-router-dom'
import { TextBlockNode } from './nodes/TextBlockNode'
import { Typography } from '@mui/material'
import { HighlightDepNode } from './nodes/HighlightDepNode'
import ExampleTheme from './themes/ExampleTheme'
import { $getSelection, ParagraphNode, TextNode, $getNodeByKey, RootNode, LineBreakNode, $getRoot, $nodesOfType } from 'lexical'

import { styled, useTheme } from '@mui/material/styles'
import { useEditor, Editor, useValue } from 'tldraw'
import { FloatingMenuPlugin } from './plugins/FloatingMenuPlugin';
import { current } from './time'

import {
    setCurClickedNodeKey,
    setCurClickedCiteKey,
  } from './slices/EditorSlice'
import { useEffect } from 'react'

const editorConfig = {
    // The editor theme
    theme: ExampleTheme,
    // Handling of errors during update
    onError (error) {
      throw error
    },
    // Any custom nodes go here
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      HighlightDepNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      TextBlockNode
    ]
  }

  function Placeholder () {
    return <div className='editor-placeholder'>Generated report will be presented here...</div>
  }

  const AppBar = styled('div')({
    height: '46px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
    width: '100%',
  })
  
  const Main = styled('main')({
    flexGrow: 1,
    height: 'calc(100% - 46px)',
    overflow: 'auto',
  })

  export default function ReportEditor () {
    const dispatch = useDispatch();

    const isCurNodeEditable = useSelector(state => state.editor.isCurNodeEditable);
    const studyCondition = useSelector(state => state.editor.studyCondition);
    const sessionId = useSelector(state => state.editor.sessionId);
    const taskDescription = useSelector(state => state.editor.taskDescription);
    const curClickedNodeKey = useSelector(state => state.editor.curClickedNodeKey);
    const curSelectedNodeKey = useSelector(state => state.editor.curSelectedNodeKey);
    const generatedReport = useSelector(state => state.editor.report);
    const underlineNodeKeys = useSelector(state => state.editor.underLineNodeKeys);
    // const savedVersions = useSelector(state => state.editor.savedVersions);
    // const versionDict = useSelector(state => state.editor.versionDict);
    // const selectedVersion = useSelector(state => state.editor.selectedVersion);

    const tlEditor = useEditor();
    const [editor, setEditor] = useState(null);
    const snapshot = useValue('snapshot', () => editor?.store.getSnapshot(), [editor]);
    const [clusterDict, setClusterDict] = useState({});

    const keywords = useSelector(state => state.editor.keywords)

    useEffect(() => {
      if (generatedReport && generatedReport.trim() !== '') {
        const report = JSON.parse(generatedReport);
        const currentClusterDict = {};
        if (report && report["Middle_paragraph"]) {
          for (const key in report["Middle_paragraph"]) {
            const element = report["Middle_paragraph"][key];
            currentClusterDict[element["name"]] = {"id":element["id"]};
            if (element["subclusters"]) {
              for (const subcluster in element["subclusters"]) {
                currentClusterDict[element["subclusters"][subcluster]["name"]] = {"id":subcluster, "parentId":element["id"]};
              }
            }
          }
          console.log(`[${current()}]`+ "[ReportEditor2] currentClusterDict", currentClusterDict)
          setClusterDict(currentClusterDict);
        }
      }
    }, [generatedReport])

    useEffect(() => {
      console.log(`[${current()}]`+ "[ReportEditor2]underlineNodeKeys", underlineNodeKeys)
    }, [underlineNodeKeys])

    useEffect(() => {
      console.log(`[${current()}]`+ "[ReportEditor2] keywords", keywords)
    }, [keywords])

      return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <LexicalComposer initialConfig={editorConfig}>
            <AppBar>
              <ToolbarPlugin />
            </AppBar>
            <Main>
            <div>
              <div className='editor-container'>
                {/* <FloatingButtonPlugin /> */}
                {/* <LoadingPlugin /> */}
                <div className='editor-inner'>
                  <RichTextPlugin
                    contentEditable={<ContentEditable className='editor-input' style={{height: "calc(100vh - 150px)"}} />}
                    placeholder={<Placeholder />}
                  />
                  <ReportPlugin />
                  <ModifierPlugin />
                  <LinkBackPlugin />
                  <EntityLinkPlugin />
                  <HistoryPlugin />
                  <AutoFocusPlugin />
                  <CodeHighlightPlugin />
                  <ListPlugin />
                  <LinkPlugin /> 
                  <AutoLinkPlugin />
                  {/* <FloatingMenuPlugin /> */}
                  <NodeEventPlugin
                    nodeType={ParagraphNode}
                    eventType={'click'}
                    eventListener={(e, editor, key) => {
                      editor.update(() => {
                        const selection = $getSelection()
                        // const child = selection.getNodes()[0]
                        // console.log(`[${current()}]`+ '[ReportEditor] Paragraph Node is clicked', child.__text)
                        $nodesOfType(HighlightDepNode).forEach((element, index) => {
                          if (element.__hl_type === "llm-highlight-word"||element.__hl_type === "combine-highlight-word"||element.__hl_type ==="highlight-cite"){
                            element.setStyle('opacity: 0.7;')
                          }
                        })
                        // curClickedNodeKey is used to navigate the focus of the react flow to the corresponding node
                        // dispatch(setCurClickedNodeKey(child.__key))
                        // dispatch(setCurClickedNodeKey(''))
                        // editor.setEditable(true)
                        // editor.focus()
                      })
                      e.stopPropagation()
                      // dispatch(setCurClickedNodeKey("blank"));
                    }}
                    />
                  <NodeEventPlugin
                  nodeType={TextBlockNode}
                  eventType={'click'}
                  eventListener={(e, editor, key) => {
                    editor.update(() => {
                      
                      // editor.setEditable(false)
                      
                      if ($getNodeByKey(key) === null || $getNodeByKey(key) === undefined) {
                        return
                      }

                      const selection = $getSelection()
                      const child = selection.getNodes()[0]
                      console.log(`[${current()}]`+ "[ReportEditor] selection", selection)

                      //get the shape id of clicked node - section node
                      let report = null;
                      try {
                        if (generatedReport && generatedReport.trim() !== '') {
                          report = JSON.parse(generatedReport);
                        }
                      } catch (error) {
                        console.error(`[${current()}] [ReportEditor] Error parsing generatedReport:`, error);
                        return;
                      }
                      
                      const str = child.__text;
                      // console.log(`[${current()}]`+ `[ReportEditor] TextBlock text is ${str} is clicked`);

                      // // console.log("str",str)
                      // console.log(`[${current()}]`+ "[ReportEditor] Clicked TextBlock:", child);
                      if (str.includes("_")) {
                        // for citation node
                        dispatch(setCurClickedNodeKey(str));
                        console.log(`[${current()}]`+ "[ReportEditor] Clicked citation:", str);
                      }
                      else if(child.__hl_type === "llm-highlight-word"||child.__hl_type === "combine-highlight-word") {
                        // for keyword node
                        console.log(`[${current()}]`+ "[ReportEditor] Clicked keyword:", str);
                        $nodesOfType(HighlightDepNode).forEach((element, index) => {
                          // console.log("word element", element)
                          if (element.__text === str) {
                            element.setStyle('opacity: 1; border-radius: 5px; font-weight: bold; font-size: large; text-decoration: underline;')
                            dispatch(setCurClickedNodeKey(element.__text))                          }
                          else if (element.__hl_type === "llm-highlight-word"||element.__hl_type === "combine-highlight-word"||element.__hl_type ==="highlight-cite"){
                            element.setStyle('opacity: 0.7;')
                            if (underlineNodeKeys && underlineNodeKeys.includes(element.__key)){
                              element.setStyle('text-decoration: #f77c7c wavy underline')
                            }
                          }
                          // console.log("[ReportEditor] underlineNodeKeys",underlineNodeKeys)
                          // if (underlineNodeKeys && underlineNodeKeys.includes(element.__key)){
                          //   element.setStyle('text-decoration: #f77c7c wavy underline')
                          // }
                        })
                      }
                      else {
                        // for cluster name node
                        console.log(`[${current()}]`+ "[ReportEditor] Clicked session:", str);
                        console.log(`[${current()}]`+ "[ReportEditor] clusterDict[str]", clusterDict[str.substring(0, str.length-1)])
                        const input = str.substring(0, str.length-1)
                        if (clusterDict[input]){
                          dispatch(setCurClickedNodeKey(clusterDict[input].id));
                          console.log(`[${current()}]`+ "[ReportEditor] Clicked cluster:", input, "clusterDict[str]", clusterDict[input])
                        }
                        // if (report && report["Middle_paragraph"]) {
                        //   report["Middle_paragraph"].forEach((element, index) => {
                        //     if (element["name"] === str.substring(0, str.length-1)) {
                        //       dispatch(setCurClickedNodeKey(element["id"]));
                        //     }
                        //   })
                        // }
                      }
                    })
                    e.stopPropagation()
                  }}/>
                  <ListMaxIndentLevelPlugin maxDepth={7} />
                  <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> 
                </div>
              </div>
            </div>
            </Main>
          </LexicalComposer>
        </Box>
      )
  }