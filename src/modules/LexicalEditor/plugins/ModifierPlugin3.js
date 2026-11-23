import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getRoot, 
    $getSelection, 
    $createParagraphNode, 
    $createTextNode, 
    $getNodes,
    $createLineBreakNode, 
    $getNodeByKey,
    $isParagraphNode,
    $isTextNode,
} from 'lexical';
import {
    setModifiedJson,
    setModifiedState,
    setunderLineNodeKeys,
    setPreReport,
    setModifiedGeneration,
    setParagraphNodes,
    setSavedVersions,
    setVersionDict,
} from '../slices/EditorSlice.js'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode.js'
import { $createTextBlockNode, $isTextBlockNode } from '../nodes/TextBlockNode.js'
import { current } from "../time.js";
import { buildClusterStructures } from '../../Space2Think/api/buildClusterStructures.js';
import logger from "../../../utils/logger.js";
const jsDiff = require('diff');
function compareParagraph(paragraph1, paragraph2){
    const diff = jsDiff.diffWords(paragraph1, paragraph2);
    let diffReport = [];
    let idx = 0;
    
    let addedResult = [];
    for (var item in diff){
        if (diff[item].added){
            // diffReport.push(idx);
            diffReport.push([idx, idx + diff[item].value.length]);
            addedResult.push(idx, idx + diff[item].value.length, diff[item].value);
            idx += diff[item].value.length;
            
        }else if (diff[item].removed){
        }
        else{
            idx += diff[item].value.length;
        }
    }

    let index = [];
    let text = [];

    // Check if there are any differences
    if (diffReport.length === 0) {
        // No differences found, skip processing and exit
        return null;
    }

    let currentRange = diffReport[0];

    for (let j = 1; j < diffReport.length; j++) {
        const [currentStart, currentEnd] = currentRange;
        const [nextStart, nextEnd] = diffReport[j];

        // Check if the next range overlaps or is consecutive with the current range
        if (nextStart <= currentEnd + 1) {
            // Combine the ranges
            currentRange = [currentStart, Math.max(currentEnd, nextEnd)];
        } else {
            // Add the current range to the result and start a new range
            index.push([currentRange[0], currentRange[1]]);
            text.push(paragraph2.slice(currentRange[0], currentRange[1]));
            currentRange = diffReport[j];
        }
    }
    index.push(currentRange);
    text.push(paragraph2.slice(currentRange[0], currentRange[1]));
    
    // Filter out chunks that contain only symbols/punctuation
    const filteredIndex = [];
    const filteredText = [];
    
    for (let i = 0; i < index.length; i++) {
        const chunkText = text[i];
        // Check if the chunk contains only symbols/punctuation marks
        const onlySymbols = /^[^\w\s]*$/.test(chunkText);
        
        if (!onlySymbols) {
            filteredIndex.push(index[i]);
            filteredText.push(chunkText);
        }
    }
    
    // console.log(`[${current()} ModifierPlugin3]`+ "original index", index);
    // console.log(`[${current()} ModifierPlugin3]`+ "original text", text);
    // console.log(`[${current()} ModifierPlugin3]`+ "filtered index", filteredIndex);
    // console.log(`[${current()} ModifierPlugin3]`+ "filtered text", filteredText);

    // Return null if no meaningful chunks remain after filtering
    if (filteredIndex.length === 0) {
        return null;
    }

    return [filteredIndex, filteredText];
}

function getCitedText(text, citeKeywords){
    let citeIdx = [];
    let citeText = text.replace(/\s*\[[^\]]+\]/g, '');
    citeText = citeText.replace(/\(.*?\)/g, '');
    console.log(`[${current()}]`+ "[getCitedText] original text:", text);
    console.log(`[${current()}]`+ "[getCitedText] cleaned text:", citeText);
    console.log(`[${current()}]`+ "[getCitedText] citeKeywords:", citeKeywords);
    
    for (let [keyword, citation] of Object.entries(citeKeywords)) {
        let regex = new RegExp(`\\b${keyword}s?\\b`);
        citeText = citeText.replace(regex,(match, offset) => {
            // Calculate the actual length of the inserted text
            // Original: "keyword"
            // New: "keyword [1,2,3]" 
            // Additional length: " [1,2,3]" = citation.length + 1 (for the space)
            // const additionalLength = citation.length + 1;
            // citeIdx.push([offset, additionalLength]);
            
            // const insertedText = ` ${citation}`;
            
            // Return the new word with the citation
            return `${keyword} ${citation}`
        });
        
    }
    return citeText;
}

export default function ModifierPlugin() {
    const [editor] = useLexicalComposerContext();
    const dispatch = useDispatch();
    const generatedReport = useSelector(state => state.editor.report);
    const modifiedJson = useSelector(state => state.editor.modifiedJson);
    const modifiedState = useSelector(state => state.editor.modifiedState);
    const allKeywords = useSelector(state => state.editor.keywords);
    const userKeyword = useSelector(state => state.editor.UserKeywords);
    const preReport = useSelector(state => state.editor.preReport);
    const reportHistory = useSelector(state => state.editor.reportHistory);
    const modifiedGeneration = useSelector(state => state.editor.modifiedGeneration);
    const reportStructure = useSelector(state => state.space.reportStructure);
    const paragraphNodes = useSelector(state => state.editor.paragraphNodes);
    const currentSnapshot = useSelector(state => state.editor.currentSnapshot);
    // const savedVersions = useSelector(state => state.editor.savedVersions);
    // const versionDict = useSelector(state => state.editor.versionDict);

    useEffect(() => {
        //keywords
        if (modifiedGeneration && modifiedJson && reportHistory.length > 0){
            console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedJson is not empty")

            console.log(`[${current()}]`+ "[ModifierPlugin3] reportHistory length", reportHistory.length)
            const oldReport = JSON.parse(reportHistory[reportHistory.length - 2]["report"]);
            const newReport = JSON.parse(generatedReport);
            console.log("[Modifier Plugin] newReport", newReport)
            console.log("[Modifier Plugin] oldReport", oldReport)

            const citeKeywords1 = {}
            for (var item in allKeywords){
                for (var pair in allKeywords[item]){
                    citeKeywords1[pair] = '[' + allKeywords[item][pair].join(', ') + ']';
                }
            }
            // console.log(`[${current()}]`+ "[ModifierPlugin3] citeKeywords1", citeKeywords1);


            // new report citations
            const citeKeywords2 = {}
            let citationsDoc = [];
            for (var item in newReport["Middle_paragraph"]){
                citeKeywords2[newReport["Middle_paragraph"][item].id] = {}
                const citation = newReport["Middle_paragraph"][item]["keywords"].concat(", ").concat(newReport["Middle_paragraph"][item]["name entities"]);
                const text = newReport["Middle_paragraph"][item].text;
                let entries = []
                if (typeof citation === 'string'){
                    const matches = citation.match(/[\w\s]+ ?\[[^\]]+\]/g);
                    entries = matches ? matches : [];
                }
                else{entries = citation;}
                console.log("[Modifier Plugin] citation", citation)
                console.log("[Modifier Plugin] entries", entries)
                if (entries && Array.isArray(entries)) {
                    entries.forEach(entry => {
                        let match = entry.match(/^(.*?)\[(.*?)\]$/);
                        if (match){
                            const keyword = match[1].trim();
                            const ref = match[2].split(',').map(item => item.trim());
                            citeKeywords2[newReport["Middle_paragraph"][item].id][keyword] = "[" + ref.join(", ") + "]";
                            citationsDoc = citationsDoc.concat(ref);
                        }
                    });
                }
            }
            citationsDoc = citationsDoc.filter((item, index) => citationsDoc.indexOf(item) === index);
            console.log(`[${current()}]`+ "[ModifierPlugin3] citationsDoc", citationsDoc);


            // old paper citations
            const citeKeywordsOld2 = {}
            let citationsDocOld = [];
            for (var item in oldReport["Middle_paragraph"]){
                citeKeywordsOld2[oldReport["Middle_paragraph"][item].id] = {}
                let citation = "";
                let text = "";
                if (newReport["Middle_paragraph"].includes(item)){
                    citation = oldReport["Middle_paragraph"][item]["keywords"].concat(", ").concat(newReport["Middle_paragraph"][item]["name entities"]);
                    text = oldReport["Middle_paragraph"][item].text;
                }
                else{
                    citation = oldReport["Middle_paragraph"][item]["keywords"];
                    text = oldReport["Middle_paragraph"][item].text;
                }
                let entries = []
                if (typeof citation === 'string'){
                    const matches = citation.match(/[\w\s]+ ?\[[^\]]+\]/g);
                    entries = matches ? matches : [];
                }
                else{entries = citation;}
                // console.log("[Report Plugin] citation", citation)
                if (entries && Array.isArray(entries)) {
                    entries.forEach(entry => {
                        let match = entry.match(/^(.*?)\[(.*?)\]$/);
                        if (match){
                            const keyword = match[1].trim();
                            const ref = match[2].split(',').map(item => item.trim());
                            citeKeywordsOld2[oldReport["Middle_paragraph"][item].id][keyword] = "[" + ref.join(", ") + "]";
                            citationsDocOld = citationsDocOld.concat(ref);
                        }
                    });
                }
            }
            // console.log(`[${current()}]`+ "[ModifierPlugin3] citeKeywords2", citeKeywords2)
            // remove duplicates
            citationsDocOld = citationsDocOld.filter((item, index) => citationsDocOld.indexOf(item) === index);
            // console.log(`[${current()}]`+ "[ModifierPlugin3] citationsDoc", citationsDoc)

            const citeKeywords3 = {}
            console.log(`[${current()}]`+ "[ModifierPlugin3] allKeywords", allKeywords)
            for (var item in allKeywords){
                for (var pair in allKeywords[item]){
                    let entries = [];
                    for (var cites in allKeywords[item][pair]){
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] cites", allKeywords[item][pair][cites], "citationsDoc", citationsDoc)
                        if (citationsDoc.includes(allKeywords[item][pair][cites])){
                            entries.push(allKeywords[item][pair][cites]);
                        }
                }
                    if (entries.length > 0){
                        citeKeywords3[pair] = '[' + entries.join(', ') + ']';
                    }
                }
            }
            // console.log(`[${current()}]`+ "[ModifierPlugin3] citeKeywords3", citeKeywords3);


            let paragraphs = [];
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

            // const { hierarchicalStructure, clusterWithAllMembers, clusters_v2 } = buildClusterStructures(dict, data, current);

            // console.log("[Modifier Plugin] hierarchicalStructure", hierarchicalStructure)
            // console.log("[Modifier Plugin] clusterWithAllMembers", clusterWithAllMembers)
            // console.log("[Modifier Plugin] clusters_v2", clusters_v2)


            let modifiedArray = [];
            let modifiedWordArray = [];
            const paragraphNodes = {}
            let num = 0;
            const subclusters = []
            const oldReportMiddleParagraph = {}
            for (var item in oldReport["Middle_paragraph"]){
                const id = oldReport["Middle_paragraph"][item].id;
                oldReportMiddleParagraph[id] = oldReport["Middle_paragraph"][item].text;
                if (oldReport["Middle_paragraph"][item].subclusters){
                    console.log("[Modifier Plugin] newReport['Middle_paragraph'].subclusters", oldReport["Middle_paragraph"][item].subclusters)
                    for (var subcluster in oldReport["Middle_paragraph"][item].subclusters){
                        console.log("[Modifier Plugin] subcluster", subcluster)
                        oldReportMiddleParagraph[subcluster] = oldReport["Middle_paragraph"][item].subclusters[subcluster].text;
                    }
                }
            }
            console.log("[Modifier Plugin] oldReportMiddleParagraph", oldReportMiddleParagraph);

            console.log("[Modifier Plugin] reportStructure", reportStructure)
            if (reportStructure){
                for (var i in reportStructure){
                    if (reportStructure[i].label === "Cluster Analysis"){
                        const mp = newReport["Middle_paragraph"];
                        // console.log("[Modifier Plugin] mp", mp)

                        for (const p of Object.keys(mp)){
                                // process the main clusters
                                const id = mp[p].id;
                                const clusterName = data[id].props.name;
                                console.log("[Modifier Plugin] clusterName", clusterName)
                                if (clusterName){
                                    paragraphs.push(clusterName);
                                }
                                else{
                                    paragraphs.push(mp[p].name);
                                }
                                console.log("[Modifier Plugin] mp[p]", mp[p])
                                let newText = mp[p].text;
                                // let newText = getCitedText(mp[p].text,citeKeywords2[id]);
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] paragraph text", newText)
                                paragraphs.push(newText);

                                paragraphNodes[mp[p].id] = num + 1;
                                num += 2;

                                let newParagraph = true;
                                if (id in oldReportMiddleParagraph){
                                    newParagraph = false;
                                    const diffResult = compareParagraph(oldReportMiddleParagraph[id], newText);
                                    if (diffResult) {
                                        const [index, text] = diffResult;
                                        console.log(`[${current()}]`+ "[ModifierPlugin3] middle paragraph diff text", text, "index", index)
                                        modifiedArray.push(index);
                                        modifiedWordArray.push(text);
                                    }
                                    else{
                                        modifiedArray.push([]);
                                        modifiedWordArray.push([]);
                                    }
                                }else{
                                    console.log(`[${current()}]`+ "[ModifierPlugin3] Old report data not found for id:", id, "treating as new paragraph");
                                    modifiedArray.push([[0, newText.length]]);
                                    modifiedWordArray.push([]);
                                }

                                // process the subclusters - loop both old and new reports
                                if (mp[p].subclusters){
                                    for (const member of Object.keys(mp[p].subclusters)){
                                        console.log("[Report Plugin] member", (mp[p].subclusters[member]))
                                        // paragraphs.push(mp[p].subclusters[member].name);
                                        if (member in data){
                                            const subclusterName = data[member].props.name;
                                            if (subclusterName){
                                                paragraphs.push(subclusterName);
                                            }
                                            else{
                                                paragraphs.push(mp[p].subclusters[member].name);
                                            }
                                            let new_sub_text = mp[p].subclusters[member].text;
                                            paragraphs.push(new_sub_text);
                                            subclusters.push(num);
                                            subclusters.push(num+1);
                                            paragraphNodes[member] = num + 1;
                                            num += 2;

                                            if (member in oldReportMiddleParagraph){
                                                const old_sub_text = oldReportMiddleParagraph[member];
                                                newParagraph = false;
                                                const diffResult = compareParagraph(old_sub_text, new_sub_text);
                                                if (diffResult) {
                                                    const [index, text] = diffResult;
                                                    console.log(`[${current()}]`+ "[ModifierPlugin3] middle paragraph diff text", text, "index", index)
                                                    modifiedArray.push(index);
                                                    modifiedWordArray.push(text);
                                                }
                                                else{
                                                    modifiedArray.push([]);
                                                    modifiedWordArray.push([]);
                                                }
                                            }
                                            else{
                                                console.log(`[${current()}]`+ "[ModifierPlugin3] Old report data not found for id:", member, "treating as new paragraph");
                                                modifiedArray.push([[0, new_sub_text.length]]);
                                                modifiedWordArray.push([]);
                                            }
                                        }
                                    }

                                        // for (var nr in newReport["Middle_paragraph"]){
                                        //     if (newReport["Middle_paragraph"][nr].id === (hierarchicalStructure[key].children[member])){
                                        //         console.log("[Modifier Plugin] newReport['Middle_paragraph'][nr]", newReport["Middle_paragraph"][nr])
                                        //         // push to paragraphs
                                        //         // newParagraph = true;
                                        //         paragraphs.push(newReport["Middle_paragraph"][nr].name);
                                        //         let newText = newReport["Middle_paragraph"][nr].text;
                                        //         // let newText = getCitedText(newReport["Middle_paragraph"][nr].text,citeKeywords2[id]);
                                        //         paragraphs.push(newText);
                                        //         subclusters.push(num);
                                        //         subclusters.push(num+1);

                                        //         paragraphNodes[newReport["Middle_paragraph"][nr].id] = num + 1;
                                        //         num += 2;
                                        //         newParagraph = true;

                                        //         for (var qr in oldReport["Middle_paragraph"]){
                                        //             console.log("[Modifier Plugin] oldReport['Middle_paragraph'][qr]", oldReport["Middle_paragraph"][qr])
                                        //             if (oldReport["Middle_paragraph"][qr].id === (hierarchicalStructure[key].children[member])){
                                        //                 // push to paragraphs
                                        //                 const id = oldReport["Middle_paragraph"][qr].id;
                                        //                 const item = "Middle_paragraph";
                                        //                 // Check if oldReport["Middle_paragraph"][p] exists before accessing its text property
                                        //                 if (oldReport[item] && oldReport[item][qr] && oldReport[item][qr].text) {
                                        //                     let oldText = oldReport[item][qr].text;
                                        //                     // let oldText = getCitedText(oldReport[item][q].text,citeKeywordsOld2[id]);
                                        //                     // console.log("[Modifier Plugin] oldText", newReport["Middle_paragraph"][nr].name, oldText)
                                        //                     // console.log("[Modifier Plugin] newText", newReport["Middle_paragraph"][nr].name, newText)
                                        //                     const diffResult = compareParagraph(oldText, newText);
                                        //                     if (diffResult) {
                                        //                         const [index, text] = diffResult;
                                        //                         console.log(`[${current()}]`+ "[ModifierPlugin3] middle paragraph diff text", newReport["Middle_paragraph"][nr].name, text, "index", index)
                                        //                         modifiedArray.push(index);
                                        //                         modifiedWordArray.push(text);
                                        //                     }
                                        //                     else{
                                        //                         modifiedArray.push([]);
                                        //                         modifiedWordArray.push([]);
                                        //                     }
                                                        
                                        //                     newParagraph = false;
                                        //                     break;
                                        //                 }
                                        //             } 
                                        //         }

                                        //         // if not exist in old report
                                        //         if (newParagraph){
                                        //             console.log(`[${current()}]`+ "[ModifierPlugin3] Old report data not found for id:", id, "treating as new paragraph");
                                        //             modifiedArray.push([[0, newText.length]]);
                                        //             modifiedWordArray.push([]);
                                        //         }
                                        //     }
                                        // }
                                }
                                // break;
                            }
                            
                                
                            
                        dispatch(setParagraphNodes(paragraphNodes));
                        console.log("[Modifier Plugin] paragraphNodes", paragraphNodes);
                        console.log("[Modifier Plugin] subclusters", subclusters);
                    }
                    else{
                        console.log("[Modifier Plugin] reportStructure[i]", reportStructure[i])
                        const name = reportStructure[i].label;
                        console.log("[Modifier Plugin] name", name)
                        if (!newReport.hasOwnProperty(name)){
                            console.log("[Modifier Plugin] newText not found", name)
                            continue;
                        }
                        let newText = newReport[name];
                        // let newText = getCitedText(newReport[name],citeKeywords3);
                        paragraphs.push(name);
                        paragraphs.push(newText);
                        num += 2;
                        
                        let oldText = oldReport[name];
                        // let oldText = getCitedText(oldReport[name],citeKeywords3);
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] oldText", name, oldText)
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] newText", name, newText)
                        // paragraphs.push(oldText);
                        if (oldText && newText){
                            const diffResult = compareParagraph(oldText, newText);
                            if (diffResult) {
                                const [index, text] = diffResult;
                                console.log(`[${current()}]`+ "[ModifierPlugin3] diff text", name, text, "index", index)
                                modifiedArray.push(index);
                                modifiedWordArray.push(text);
                            }else{
                                modifiedArray.push([]);
                                modifiedWordArray.push([]);
                            }
                        }
                        else{
                            modifiedArray.push([[0, newText.length]]);
                            modifiedWordArray.push([]);
                        }
                    }
                }
            }

            console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedArray", modifiedArray);
            console.log(`[${current()}]`+ "[ModifierPlugin3] paragraphs", paragraphs);
            console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedWordArray", modifiedWordArray);

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
            console.log("[Report Plugin] reportStructureArray", reportStructureArray)
            console.log(`[${current()}]`+ "[ModifierPlugin3] paragraphs", paragraphs)

            editor.update(() => {
                const root = $getRoot();
                if (!root.isEmpty()) {
                    const nodes = root.getChildren();
                    nodes.forEach(node => {
                        node.remove()
                    })
                }

                if (generatedReport !== '') {
                    const root = $getRoot();
                                        
                    // Get the selection from the EditorState
                    const length = paragraphs.length - 1;
                    
                    let under = [];
                    for (var i in paragraphs){
                        const paragraph = paragraphs[i];

                        // Add comprehensive logging for middle paragraphs
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Processing paragraph i:", i, "type:", i == 0 ? "Summarization" : (i == paragraphs.length-1 ? "Conclusion" : "Middle"), "length:", paragraph.length);
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Paragraph content:", JSON.stringify(paragraph));

                        //section name
                        if (i % 2 === 0){
                            console.log("[Report Plugin] reportStructureArray.includes(paragraph)", reportStructureArray.includes(paragraph))
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
                        if (subclusters.includes(parseInt(i))){
                            paragraphNode.setIndent(1);
                        }

                        let chunks = [];
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Starting chunks processing for paragraph i:", i);
                        
                        // Process keywords
                        for (var j in keywords){
                            // console.log('paragraph', paragraph)
                            // let startIndex = 0;
                            const regex = new RegExp(`\\b${keywords[j]}\\b`,'g');
                            const matches = [...paragraph.matchAll(regex)];
                            const result = matches.map(match => match.index);
                            // console.log(`[${current()}]`+ "[ModifierPlugin3] Keyword:", keywords[j], "matches at positions:", result);
                            for (var k in result){
                                chunks.push(result[k]);
                                chunks.push(result[k] + keywords[j].length);
                            }
                        }

                        const pattern = /\[(.*?)\]/g;
                        const matches = [...paragraph.matchAll(pattern)];
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Citation matches:", matches);

                        let results = {};
                        for (var j in matches){
                            let match = matches[j][0];
                            // let ref = match.slice(1, -1);
                            // console.log('[ModifierPlugin3] match', match.slice(1,match.length-1))
                            const contents = match.slice(1,match.length-1).split(',').map(item => item.trim());
                            // console.log(`[${current()}]`+ "[ModifierPlugin3] Citation contents:", contents);
                            let startIndex = matches[j].index + 1;
                            for (var k in contents){
                                results[contents[k]] = {};
                                results[contents[k]].match = contents[k];
                                results[contents[k]].startIndex = startIndex;
                                results[contents[k]].endIndex = startIndex + contents[k].length;
                                chunks.push(startIndex);
                                chunks.push(startIndex + contents[k].length);
                                chunks = chunks.filter(function(idx) {
                                    return idx <= startIndex || idx >= startIndex + contents[k].length;
                                });
                                startIndex = startIndex + contents[k].length + 2;
                            }
                        }
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] results", results)

                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Before adding 0 and length, chunks:", chunks);
                        chunks.push(0);
                        chunks.push(paragraph.length);
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] After adding 0 and length, chunks:", chunks);

                        const modifiedPart = [];
                        let index = 0;
                        if (i<=paragraphs.length-1){
                            index = Math.floor(i / 2);
                        }
                        
                        // Safely get modified parts for this paragraph
                        if (modifiedArray[index] && Array.isArray(modifiedArray[index])) {
                            for (var j in modifiedArray[index]){
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedArray[index][j]", modifiedArray[index][j])
                                if (modifiedArray[index][j] && Array.isArray(modifiedArray[index][j]) && modifiedArray[index][j].length >= 2) {
                                    modifiedPart.push(modifiedArray[index][j]);
                                    chunks.push(modifiedArray[index][j][0]);
                                    chunks.push(modifiedArray[index][j][1]);
                                }
                            }
                        }
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] paragraph index:", index, "modifiedPart:", modifiedPart);
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] After adding modified parts, chunks:", chunks);

                        chunks.sort((a,b)=>a-b);
                        const uniquechunks = chunks.filter((item, index) => {
                            return chunks.indexOf(item) === index;
                        });
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Final uniquechunks:", uniquechunks);
                        
                        // keywords coloring
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Starting text processing with", uniquechunks.length - 1, "chunks");
                        for (let j = 0; j < uniquechunks.length - 1; j++){
                            const start = uniquechunks[j];
                            const end = uniquechunks[j + 1];
                            const textNode = $createTextNode(paragraph.slice(start, end));
                            const word = paragraph.slice(start, end);
                            
                            // console.log(`[${current()}]`+ "[ModifierPlugin3] Chunk", j, "start:", start, "end:", end, "word:", JSON.stringify(word), "word length:", word.length);
                            
                            // console.log(`[${current()}]`+ '[ModifierPlugin3] word', word)
                            if(keywords.includes(word)) {
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] Processing keyword:", word);
                                if (userKeyword !== undefined){
                                    // console.log(`[${current()}]`+ "[ModifierPlugin3]  Give colors to the keywords")
                                    // const hlNode = $createHighlightDepNode('highlight-word', word);
                                    let hlNode = $createHighlightDepNode('highlight-word', word);
                                    if (userKeyword["userKy"].includes(word)){
                                        hlNode = $createHighlightDepNode('combine-highlight-word', word);
                                    }else if (userKeyword["llmKy"].includes(word)){
                                        hlNode = $createHighlightDepNode('llm-highlight-word', word)
                                    }
                                    // Check if this word overlaps with any modified part
                                    let isModified = false;
                                    for (var k in modifiedPart){
                                        if (end <= modifiedPart[k][1] && start >= modifiedPart[k][0]){
                                            hlNode.setStyle('text-decoration:rgb(244, 25, 25) wavy underline');
                                            under.push(hlNode.getKey());
                                            isModified = true;
                                            // console.log(`[${current()}]`+ "[ModifierPlugin3] Keyword modified:", word, "range:", [start, end], "modifiedPart:", modifiedPart[k], "paragraph", i);
                                            break;
                                        }
                                    }
                                    const textBlockNode = $createTextBlockNode()
                                    textBlockNode.append(hlNode);
                                    paragraphNode.append(textBlockNode);
                                }

                            }else if ((/^(?:[A-Za-z]+[_](?:[A-Za-z]+[_]?[a-z]?\d*|\d+)|\d+)$/).test(word) || citationsDoc.includes(word)){
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] Processing citation:", word);
                                // citation
                                const hlNode = $createHighlightDepNode('highlight-cite', word);
                                hlNode.setStyle('color: #014591');
                                // Check if this citation overlaps with any modified part
                                for (var k in modifiedPart){
                                    if (end <= modifiedPart[k][1] && start >= modifiedPart[k][0]){
                                        hlNode.setStyle('text-decoration:rgb(244, 25, 25) wavy underline');
                                        under.push(hlNode.getKey());
                                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Citation modified:", word, "range:", [start, end], "modifiedPart:", modifiedPart[k], "paragraph", i);
                                        break;
                                    }
                                }
                                const textBlockNode = $createTextBlockNode()
                                textBlockNode.append(hlNode);
                                paragraphNode.append(textBlockNode);
                            } else{
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] Processing normal text:", word);
                                let isModified = false;
                                // console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedPart", modifiedPart, "paragraph", i)
                                if (modifiedPart.length > 0){
                                    // console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedPart[k][0]", modifiedPart[k][0], "paragraph", paragraph, "i", i)
                                    // console.log(`[${current()}]`+ "[ModifierPlugin3] modifiedPart[k][1]", modifiedPart[k][1], "paragraph", paragraph, "i", i)
                                    for (var k in modifiedPart){
                                        if (end <= modifiedPart[k][1] && start >= modifiedPart[k][0]){
                                            // console.log(`[${current()}]`+ '[ModifierPlugin3] modifiedPart[word]', word)
                                            textNode.setStyle('text-decoration:rgb(244, 25, 25) wavy underline');
                                            isModified = true;
                                            //  console.log(`[${current()}]`+ "[ModifierPlugin3] Normal text modified:", word, "range:", [start, end], "modifiedPart:", modifiedPart[k], "paragraph", i);
                                            break;
                                        }
                                        
                                    }
                                }
                                // normal text
                                if (!isModified){
                                    // const textNode = $createTextNode(paragraph.slice(start, end));
                                    paragraphNode.append(textNode);
                                }else{
                                    const hlNode = $createHighlightDepNode('modified-word', word);
                                    const textBlockNode = $createTextBlockNode()
                                    textBlockNode.append(hlNode);
                                    paragraphNode.append(textBlockNode);
                                }
                                
                            }
                            
                        }

                        // Finally, append the paragraph to the root
                        root.append(paragraphNode);
                        // console.log(`[${current()}]`+ "[ModifierPlugin3] Finished processing paragraph i:", i);
                        
    
                    }
                    dispatch(setModifiedState(false))
                    dispatch(setModifiedJson(''))
                    dispatch(setunderLineNodeKeys(under))
                    const editorState = editor.getEditorState()

                    logger.logUserAction(`[${current()}]`+ "[ModifierPlugin3] presentedReport", {details: editorState.toJSON()})
                    // console.log('underlineNodeKeys', underlineNode)
                }
            })

            // // current version
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
        // dispatch(setPreReport(generatedReport));
}, [modifiedJson]);
}