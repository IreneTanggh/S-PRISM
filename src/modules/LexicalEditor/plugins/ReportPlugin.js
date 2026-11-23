// import { registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getRoot, 
    $getSelection, 
    $createParagraphNode, 
    $createTextNode, 
    $getNodes,
    $createLineBreakNode, 
    // $createCodeHighlightNode,
} from 'lexical';
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode,
  } from '@lexical/rich-text'
import CodeHighlightPlugin from './CodeHighlightPlugin'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import {$createListNode} from '@lexical/list'
import { TextBlockNode } from '../nodes/TextBlockNode'
import { $createTextBlockNode, $isTextBlockNode } from '../nodes/TextBlockNode'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode'

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showModifications } from "../../Space2Think/api/showModification.tsx";
import {
    setModifiedJson,
    setModifiedState,
    setNodeKeys,
    setNodeContent,
    setSavedVersions,
    setVersionDict,
    setParagraphNodes,
  } from '../../LexicalEditor/slices/EditorSlice.js'
import { current } from '../time'
import { buildClusterStructures } from '../../Space2Think/api/buildClusterStructures.js';

function saveText(data) {
    if(!data) {
        console.error('No data to save');
        return;
    }

    const filename = 'textReport.txt';

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }

    const blob = new Blob([data], {type: 'text/json'});
    const e = document.createEvent('MouseEvents');
    const a = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
}


export default function ReportPlugin() {
    const [editor] = useLexicalComposerContext();
    const dispatch = useDispatch();
    const generatedReport = useSelector(state => state.editor.report)
    const userKeyword = useSelector(state => state.editor.UserKeywords)
    const [report, setReport] = useState('');
    const allKeywords = useSelector(state => state.editor.keywords)
    const modifiedJson = useSelector(state => state.editor.modifiedJson)
    const reportHistory = useSelector(state => state.editor.reportHistory)
    const modifiedGeneration = useSelector(state => state.editor.modifiedGeneration)
    const reportStructure = useSelector(state => state.space.reportStructure)
    const currentSnapshot = useSelector(state => state.editor.currentSnapshot)
    // const savedVersions = useSelector(state => state.editor.savedVersions);
    // const versionDict = useSelector(state => state.editor.versionDict);

    function simplifyStrings(str1) {
        // Remove punctuation and special characters
        return str1.toLowerCase().trim();
    }
    // console.log(`[${current()}]`+ "[Report Plugin] reportHistory.length", reportHistory.length);
    // console.log(`[${current()}]`+ "[Report Plugin] generatedReport", generatedReport);

    if (generatedReport !== '' && generatedReport !== "undefined" && generatedReport !== null && generatedReport !== undefined) {
        // console.log(`[${current()}]`+ "[Report Plugin] Enter into the report plugin");
        console.log(`[${current()}]`+ "[Report Plugin] modifiedGeneration", modifiedGeneration)
        // console.log(`[${current()}]`+ "[Report Plugin] reportHistory.length", reportHistory.length)
        
        if (!modifiedGeneration){
            const jsonReport = JSON.parse(generatedReport);
            // console.log(`[${current()}]`+ "[Report Plugin] jsonReport", jsonReport)

            //keywords
            const citeKeywords1 = {}
            for (var item in allKeywords){
                for (var pair in allKeywords[item]){
                    citeKeywords1[pair] = '[' + allKeywords[item][pair].join(', ') + ']';
                }
            }
            // console.log(`[${current()}]`+ "[Report Plugin] citeKeywords1", citeKeywords1);

            const citeKeywords2 = {}
            let citations = []
            for (var item in jsonReport["Middle_paragraph"]){
                citeKeywords2[jsonReport["Middle_paragraph"][item].id] = {}
                const citation = jsonReport["Middle_paragraph"][item]["keywords"].concat(", ").concat(jsonReport["Middle_paragraph"][item]["name entities"]);
                const text = jsonReport["Middle_paragraph"][item].text;
                let entries = []
                if (typeof citation === 'string'){
                    entries = citation.split('], ');
                }
                else{entries = citation;}
                // console.log("[Report Plugin] citation", citation)
                entries.forEach(entry => {
                    let [match1, match2] = entry.split('[')

                    if (match1 && match2) {
                        let keyword = match1.trim();
                        let ref = match2.trim();
                        // Remove the closing bracket if it exists
                        if (ref.endsWith(']')) {
                            ref = ref.slice(0, -1);
                        }
                        citeKeywords2[jsonReport["Middle_paragraph"][item].id][keyword] = "[" + ref + "]";
                        citations = citations.concat(ref);
                    }
                });
            }
            citations = citations.filter((item, index) => citations.indexOf(item) === index);
            // console.log(`[${current()}]`+ "[Report Plugin] citations", citations);

            const citeKeywords3 = {}
            // console.log(`[${current()}]`+ "[Report Plugin] allKeywords", allKeywords)
            for (var item in allKeywords){
                for (var pair in allKeywords[item]){
                    let entries = [];
                    for (var cites in allKeywords[item][pair]){
                        if (citations.includes(allKeywords[item][pair][cites])){
                            entries.push(allKeywords[item][pair][cites]);
                        }
                    }
                    if (entries.length > 0){
                        citeKeywords3[pair] = '[' + entries.join(', ') + ']';
                    }
                }
            }
            // console.log(`[${current()}]`+ "[Report Plugin] citeKeywords3", citeKeywords3);

            //json report
            const paragraphs = []
            const data = currentSnapshot.store;
            const dict = {};
            for (const key in data) {
                if (data[key].id.includes("shape")) {
                    if (data[key]["type"] === "frame") {
                        dict[data[key].id] = 
                        {
                            name: data[key].props.name, 
                            text: {},
                            x: data[key].props.x,
                            y: data[key].props.y,
                            parentId: data[key].parentId,
                        };
                    }
                }
            }
            for (const key in data) {
                // console.log("[Report Plugin] data[key]['type']", data[key]["type"])
                if (data[key]["type"] === "xx_html") {
                    // console.log("[Report Plugin] data[key].parentId", data[key].parentId)
                    if(data[key].parentId in dict) {
                        // console.log("[Report Plugin] data[key].parentId", data[key].parentId)
                        dict[data[key].parentId].text[data[key].id] = {
                            content: data[key].props.content, 
                            label: data[key].props.label,
                            highlight: data[key].props.highlight,
                            commonhl: data[key].props.commonhl,
                            omithl: data[key].props.omithl,
                        }
                    }
                }
            }
            // console.log("[Report Plugin] dict", dict)
            // console.log("[Report Plugin] data", data)

            // const { hierarchicalStructure, clusterWithAllMembers, clusters_v2 } = buildClusterStructures(dict, data, current);
            // console.log("[Report Plugin] hierarchicalStructure", hierarchicalStructure)
            // First, process according to reportStructure order
            const subclusters = []
            let num = 0;
            const paragraphNodes = {};
            for (const structureItem of reportStructure) {
                const structureLabel = structureItem.label;
                
                // Check if this structure item exists in jsonReport
                if (jsonReport[structureLabel]) {
                    // Direct match (like Introduction, Conclusion)
                    paragraphs.push(structureLabel);
                    let citeText = jsonReport[structureLabel];
                    paragraphs.push(citeText);
                    num += 2;
                    // console.log("[Report Plugin] citeText", citeText)
                } else if (structureLabel === "Cluster Analysis" && jsonReport["Middle_paragraph"]) {
                    // if (jsonReport["Middle_paragraph"]){
                        // Handle Middle_paragraph as Cluster Analysis
                        const mp = jsonReport["Middle_paragraph"];
                        for (const p of Object.keys(mp)){
                            // paragraphs.push(mp[p].name);
                            if (mp[p].id in data){
                                const clusterName = data[mp[p].id].props.name;
                                if (clusterName){
                                    paragraphs.push(clusterName);
                                }
                                else{
                                    paragraphs.push(mp[p].name);
                                }
                                let citeText = mp[p].text;
                                paragraphs.push(citeText);
                                paragraphNodes[mp[p].id] = num + 1;
                                num += 2;

                                // console.log("[Report Plugin] hierarchicalStructure[key].children", hierarchicalStructure[key].children)
                                // console.log("[Report Plugin] mp[p]['subclusters']", mp[p]["subclusters"])
                                if (mp[p].subclusters){
                                    for (const member in mp[p].subclusters){
                                        // paragraphs.push(mp[p].subclusters[member].name);
                                        if (member in data){
                                            const subclusterName = data[member].props.name;
                                            if (subclusterName){
                                                paragraphs.push(subclusterName);
                                            }
                                            else{
                                                paragraphs.push(mp[p].subclusters[member].name);
                                            }
                                            let citeText = mp[p].subclusters[member].text;
                                            paragraphs.push(citeText);
                                            subclusters.push(num);
                                            subclusters.push(num+1);
                                            paragraphNodes[member] = num + 1;
                                            num += 2;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // else{
                    //     const mp = jsonReport["Middle_paragraph"];
                    //     // console.log("[Report Plugin] present initial generated report")
                    //     for (const p of Object.keys(mp)){
                    //         paragraphs.push(mp[p].name);
                    //         let citeText = mp[p].text;
                    //         paragraphs.push(citeText);
                    //         paragraphNodes[mp[p].id] = num + 1;
                    //         num += 2;
                    //     }
                    // }
                
                    
                // }
            }
            dispatch(setParagraphNodes(paragraphNodes));
            // console.log("[Report Plugin] subclusters", subclusters)
            // console.log(`[${current()}]`+ "[ReportPlugin] paragraphs", paragraphs)

            // add the citation insertion here.

            let keywords = []
            for (var item in allKeywords["comKy"]){
                keywords.push(item)
            }
            for (var item in allKeywords["llmKy"]){
                keywords.push(item)
            }
            const reportStructureArray = []
            for (var item in reportStructure){
                reportStructureArray.push(reportStructure[item].label)
            }
            // console.log("[Report Plugin] reportStructure", reportStructure)

            if (generatedReport !== report) {
                //set report interface
                setReport(generatedReport)
                // console.log(`[${current()}]`+ '[ReportPlugin] generatedReport', generatedReport)

                editor.update(() => {
                    const selection = $getSelection();
                    const root = $getRoot();
                    if (!root.isEmpty()) {
                        const nodes = root.getChildren();
                        nodes.forEach(node => {
                            node.remove()
                        })
                    }

                    if (generatedReport !== '') {
                        const root = $getRoot();
                        let nodeKeys = [];
                        let nodeContent = [];
                        
                        // Get the selection from the EditorState
                        const selection = root;
                        const length = paragraphs.length - 1;
                        
                        for (var i in paragraphs){
                            const paragraph = paragraphs[i];

                            //section name
                            if (i % 2 === 0){
                                // console.log("[Report Plugin] reportStructureArray.includes(paragraph)", reportStructureArray.includes(paragraph))
                                const paragraphNode = $createParagraphNode();
                                if (reportStructureArray && reportStructureArray.includes(paragraph)){
                                    const textNode = $createTextNode(paragraph+":");
                                    textNode.setFormat('bold');
                                    paragraphNode.append(textNode);
                                    root.append(paragraphNode);
                                }
                                else{
                                    const hlNode = $createHighlightDepNode('highlight-sec', paragraph+":");
                                    hlNode.setStyle('color: #014591');
                                    const textBlockNode = $createTextBlockNode()
                                    textBlockNode.append(hlNode);
                                    paragraphNode.append(textBlockNode);
                                    root.append(paragraphNode);
                                    if (subclusters.includes(parseInt(i))){
                                        paragraphNode.setIndent(1);
                                    }
                                }
                                continue;
                            }
                            // Create a new ParagraphNode
                            const paragraphNode = $createParagraphNode();
                            // console.log("[Report Plugin] mark i", i)
                            // console.log("[Report Plugin] mark subclusters", subclusters)
                            // console.log("[Report Plugin] mark i in subclusters", subclusters.includes(i))
                            if (subclusters.includes(parseInt(i))){
                                // console.log("[Report Plugin] mark inside i", i)
                                // console.log("[Report Plugin] mark inside paragraph[i]", paragraph[i])
                                paragraphNode.setIndent(1);
                            }

                            const chunks = [];
                            // chunks.push(0);

                            //keywords put into chunks
                            for (var j in keywords){
                                // console.log('paragraph', paragraph)
                                // let startIndex = 0;
                                const regex = new RegExp(`\\b${keywords[j]}\\b`,'g');
                                const matches = [...paragraph.matchAll(regex)];
                                const result = matches.map(match => match.index);
                                for (var k in result){
                                    chunks.push(result[k]);
                                    chunks.push(result[k] + keywords[j].length);
                                }
                            }

                            //citations put into chunks
                            const pattern = /\[(.*?)\]/g;
                            const matches = [...paragraph.matchAll(pattern)];
                            // console.log(`[${current()}]`+ "[ReportPlugin] matches", matches)

                            let results = {};
                            for (var j in matches){
                                let match = matches[j][0];
                                // let ref = match.slice(1, -1);
                                // console.log(`[${current()}]`+ '[ReportPlugin] match', match.slice(1,match.length-1))
                                const contents = match.slice(1,match.length-1).split(',').map(item => item.trim());
                                let startIndex = matches[j].index + 1;
                                for (var k in contents){
                                    results[contents[k]] = {};
                                    results[contents[k]].match = contents[k];
                                    results[contents[k]].startIndex = startIndex;
                                    results[contents[k]].endIndex = startIndex + contents[k].length;
                                    chunks.push(startIndex);
                                    chunks.push(startIndex + contents[k].length);
                                    startIndex = startIndex + contents[k].length + 2;
                                }
                            }
                            // console.log(`[${current()}]`+ '[ReportPlugin] cite document results', results)

                            chunks.push(0);
                            chunks.push(paragraph.length);
                            chunks.sort((a,b)=>a-b);
                            const uniquechunks = chunks.filter((item, index) => {
                                return chunks.indexOf(item) === index;
                            });
                            // console.log(`[${current()}]`+ '[ReportPlugin] uniquechunks', uniquechunks)

                            // keywords coloring
                            for (let j = 0; j < uniquechunks.length - 1; j++){
                                const start = uniquechunks[j];
                                const end = uniquechunks[j + 1];
                                const textNode = $createTextNode(paragraph.slice(start, end));
                                const word = paragraph.slice(start, end);
                                // console.log(`[${current()}]`+ '[ReportPlugin] word', word)
                                console.log(`[${current()}]`+ "[ReportPlugin] userKeyword", userKeyword)
                                if(keywords.includes(word)) {
                                    if (userKeyword !== undefined && userKeyword !== null){
                                        // console.log(`[${current()}]`+ "[ReportPlugin] Give colors to the keywords")
                                        // const hlNode = $createHighlightDepNode('highlight-word', word);
                                        let hlNode = $createHighlightDepNode('highlight-word', word);
                                        if (userKeyword["userKy"] && Array.isArray(userKeyword["userKy"]) && userKeyword["userKy"].includes(word)){
                                            hlNode = $createHighlightDepNode('combine-highlight-word', word);
                                        }else if (userKeyword["llmKy"] && Array.isArray(userKeyword["llmKy"]) && userKeyword["llmKy"].includes(word)){
                                            hlNode = $createHighlightDepNode('llm-highlight-word', word)
                                        }
                                        const textBlockNode = $createTextBlockNode()
                                        textBlockNode.append(hlNode);
                                        paragraphNode.append(textBlockNode);
                                        nodeKeys.push(textBlockNode.getKey());
                                        nodeContent.push(word);
                                    }
                                }else if (
                                    // citations.includes(word)
                                    (/^(?:[A-Za-z]+[_](?:[A-Za-z]+[_]?[a-z]?\d*|\d+)|\d+)$/).test(word)
                                ){
                                    // citation
                                    const hlNode = $createHighlightDepNode('highlight-cite', word);
                                    hlNode.setStyle('color: #014591');
                                    const textBlockNode = $createTextBlockNode()
                                    textBlockNode.append(hlNode);
                                    paragraphNode.append(textBlockNode);
                                    nodeKeys.push(textBlockNode.getKey());
                                    nodeContent.push(word);
                                } else{
                                    // normal text
                                    paragraphNode.append(textNode);
                                    nodeKeys.push(textNode.getKey());
                                    nodeContent.push(word);
                                }
                            }

                            // Finally, append the paragraph to the root
                            root.append(paragraphNode);
        
                        }

                        setReport(generatedReport);
                        dispatch(setNodeKeys(nodeKeys));
                        dispatch(setNodeContent(nodeContent));
                        //save text
                        const editorState = editor.getEditorState()
                        // saveText(editorState.toJSON())
                    }
                });
                // current version
                // const currentVersion = "v" + reportHistory.length;
                // const versions = Array.isArray(savedVersions) ? savedVersions : [];
                // const newVersions = [...versions, currentVersion];
                // dispatch(setSavedVersions(newVersions));

                // // add the editor state to the savedVersions
                // const editorState = JSON.stringify(editor.getEditorState())
                // if (!(currentVersion in versionDict)){
                //     const newVersionDict = {...versionDict, [currentVersion]: editorState};
                //     dispatch(setVersionDict(newVersionDict));
                // }
            }
        }
    }else{
        editor.update(() => {
            const root = $getRoot();
            const nodes = root.getChildren();
            nodes.forEach(node => {
                node.remove()
            })
        });

    }
}