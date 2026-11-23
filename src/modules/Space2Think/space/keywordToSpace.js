import { current } from '../../LexicalEditor/time.js';
import {
    useDispatch,
    useSelector
} from 'react-redux';
import { setKeywords } from '../../LexicalEditor/slices/EditorSlice.js';

function simplifyStrings(str1) {
    // Remove punctuation and special characters
    return str1.replace(/[^\w\s]/g, '').replace(/\s+/g, '').toLowerCase().trim();
}

// Shared function to process keywords for a paragraph
function processParagraphKeywords(paragraphId, paragraphData, keywords) {
    const text = paragraphData["text"];
    const nameEntities = paragraphData["name entities"] || "";
    const keywordsList = paragraphData["keywords"] || "";
    
    console.log(`[${current()}]`+ "[keywordsToST] Processing paragraph", paragraphId);
    console.log(`[${current()}]`+ "[keywordsToST] nameEntities", nameEntities);
    console.log(`[${current()}]`+ "[keywordsToST] keywordsList", keywordsList);
    
    keywords[paragraphId] = {}; // Use our generated ID
    
    // Function to process a string of keywords with citations
    const processKeywordString = (inputStr) => {
        if (!inputStr) return;
        
        // Split by comma but preserve citations
        const parts = inputStr.split(/,(?![^\[]*\])/);
        
        parts.forEach(part => {
            const trimmedPart = part.trim();
            if (!trimmedPart) return;
            
            // Extract citation if exists
            const citationMatch = trimmedPart.match(/\[([^\]]+)\]$/);
            let keyword = trimmedPart;
            let citation = null;
            
            if (citationMatch) {
                citation = citationMatch[1];
                keyword = trimmedPart.slice(0, trimmedPart.lastIndexOf('[')).trim();
            }
            
            if (!keywords[paragraphId][keyword]) {
                keywords[paragraphId][keyword] = [];
            }
            
            if (citation) {
                keywords[paragraphId][keyword] = 
                    [...new Set([...keywords[paragraphId][keyword], citation])];
            }
        });
    };
    
    // Process both name entities and keywords
    processKeywordString(nameEntities);
    processKeywordString(keywordsList);
    
    console.log(`[${current()}]`+ "[keywordsToST] Current paragraph keywords", keywords[paragraphId]);
}

export async function keywordsToST(editor, oriReport, dispatch){
    const keywords = {};
    const report = JSON.parse(oriReport);
    
    // Process main paragraphs
    for (const item in report["Middle_paragraph"]) {
        const paragraphId = `p${item}`;
        processParagraphKeywords(paragraphId, report["Middle_paragraph"][item], keywords);
    }

    // Process subclusters
    for (const item in report["Middle_paragraph"]) {
        if (report["Middle_paragraph"][item]["subclusters"]){
            for (const subclusterId in report["Middle_paragraph"][item]["subclusters"]){
                const paragraphId = `p${subclusterId}`;
                processParagraphKeywords(paragraphId, report["Middle_paragraph"][item]["subclusters"][subclusterId], keywords);
            }
        }
    }
    
    console.log(`[${current()}]`+ "[Space2Think] Final keywords_dict", keywords);

    // get whole llm highlights
    let llmKy = {}
    let llmKyList = []
    for (var item in keywords){
        if (keywords[item]){
            for (var k in keywords[item]){
                if (!llmKy.hasOwnProperty(k)){
                    llmKy[k] = []
                    llmKyList.push(k)
                }
                llmKy[k] = llmKy[k].concat(keywords[item][k])
            }
        }
    }
    console.log(`[${current()}]`+ "[Space2Think] llmKyList", llmKyList)

    // get whole space highlights
    const snapshot = editor.store.getSnapshot();
    // const spaceKy = {}
    let spaceComKy = []
    let spaceHlKy = []
    let spaceLlmKy = []
    // spaceKy["llmKy"] = []
    // spaceKy["hlKy"] = []
    // spaceKy["omitKy"] = []
    // console.log(`[${current()}]`+ "spaceHlKy", spaceHlKy)

    for (var item in snapshot.store){
        if(snapshot.store[item].type === "xx_html"){
            const hl = snapshot.store[item].props.highlight;
            const chl = snapshot.store[item].props.commonhl;
            const llmky = snapshot.store[item].props.llmhighlight;
            // const omitky = snapshot.store[item].props.omithl;
            hl.forEach((word) => {
                // console.log(`[${current()}]`+ "spaceHlKy", spaceHlKy)
                if(spaceHlKy.length === 0 || !spaceHlKy.includes(word)){
                    spaceHlKy.push(word)
                }
                // spaceKy[item].push(snapshot.store[item].props.label)
            });
            chl.forEach((word) => {
                if (!spaceComKy.includes(word)){
                    spaceComKy.push(word)
                }
                // spaceKy[item].push(snapshot.store[item].props.label)
            });
            llmky.forEach((word) => {
                // console.log(`[${current()}]`+ "llmky word", word)
                if (!spaceLlmKy.includes(word)){
                    spaceLlmKy.push(word)
                }
                // spaceKy[item].push(snapshot.store[item].props.label)
            });
            // omitky.forEach((word) => {
            //     if (!spaceKy["omitKy"].includes(word)){
            //         spaceKy["omitKy"].push(word)
            //     }
            //     // spaceKy["omitKy"][item].push(snapshot.store[item].props.label)
            // });
        }
    }
    console.log(`[${current()}]`+ "[Space2Think] spaceKy", spaceHlKy, spaceComKy, spaceLlmKy)
    
    // processed keywords for the whole space
    const newSpaceKy = {}
    newSpaceKy["comKy"] = []
    newSpaceKy["llmKy"] = []
    // newSpaceKy["hlKy"] = {}

    for (var item in spaceHlKy){
        const keyword = spaceHlKy[item];
        // console.log(`[${current()}]`+ "[Space2Think] spaceHlKy item", keyword)
        if (llmKyList.includes(keyword)){
            if (!newSpaceKy["comKy"].includes(keyword)) {newSpaceKy["comKy"].push(keyword)}
            //remove the keywords from llmKy
            llmKyList.splice(llmKyList.indexOf(keyword), 1)
        }
    }

    // concat spaceKy["llmKy"] and llmKyList
    const newLLMList = llmKyList.concat(spaceLlmKy)
    for (var item in newLLMList){
        if(newSpaceKy["llmKy"].includes(newLLMList[item])){continue;}
        const keyword = newLLMList[item];
        newSpaceKy["llmKy"].push(keyword)
    }

    console.log(`[${current()}]`+ "[Space2Think] newSpaceKy", newSpaceKy)

    // const simNewChl = newSpaceKy["comKy"].map((item) => simplifyStrings(item));
    // const simNewLky = newSpaceKy["llmKy"].map((item) => simplifyStrings(item));

    // keywords with doc label
    const allKeywords = {}
    allKeywords["comKy"] = {}
    allKeywords["llmKy"] = {}
    allKeywords["hlKy"] = {}
    
    // const snapshot = editor.store.getSnapshot();
    for (var item in snapshot.store){
        if(snapshot.store[item].type === "xx_html"){
            const id = item;
            const type = snapshot.store[item].type;
            const props = snapshot.store[item].props;
            const content = snapshot.store[item].props.content;

            const shape = snapshot.store[item];
            const label = shape.props.label;
            const parentId = shape.parentId;
            const lky = [];
            const hl = [...shape.props.highlight];
            const chl = [...shape.props.commonhl];
            const ohl = [...shape.props.omithl];

            const simLky = lky.map((item) => simplifyStrings(item)); 
            const simHl = hl.map((item) => simplifyStrings(item));
            const simChl = chl.map((item) => simplifyStrings(item));
            // const simOhl = ohl.map((item) => simplifyStrings(item));

            // add newSpaceKy combine highlights to the current shape
            for (var i in newSpaceKy["comKy"]){
                const ky = newSpaceKy["comKy"][i];
                if (!content.includes(ky)){
                    // console.log(`[${current()}]`+ "[Space to Think]  label", label, "keyword", keyword)
                    continue;
                }
                const simWord = simplifyStrings(ky)

                if (simChl.includes(simWord)){
                    continue;
                }else{
                    chl.push(ky);
                }

                const index1 = simLky.indexOf(simWord);
                if(index1 > -1){
                    lky.splice(index1, 1);
                }

                const index2 = simHl.indexOf(simWord);
                if(index2 > -1){
                    hl.splice(index2, 1);
                }

            }
            // console.log(`[${current()}]`+ "[Space2Think] ", "lky 1 ", lky, "hl", hl, "chl", chl)
            // add newSpaceKy llm highlights to the current shape
            for (var i in newSpaceKy["llmKy"]){
                const word = newSpaceKy["llmKy"][i];
                if (!content.includes(word)){
                    continue;
                }
                // console.log(`[${current()}]`+ "[Space2Think] llmky word", word)
                if (chl.includes(word)){
                    continue;
                }
                const simWord = simplifyStrings(word)
                // console.log(`[${current()}]`+ "[Space2Think] llmky compare word", word, "lky 2", lky, "simWord", simWord, "simLky", simLky)
                if (simLky.indexOf(simWord)==-1){
                    lky.push(word);
                } 
            }
                editor.updateShape(
                    {
                      id, // required
                      type, // required
                      props: {
                        ...props,
                        llmhighlight: lky,
                        highlight: hl,
                        commonhl: chl,
                      },
                    },
                )

                if(chl.length > 0){
                    chl.forEach((item) => {
                        if(!allKeywords["comKy"].hasOwnProperty(item)){
                            allKeywords["comKy"][item] = []
                        }
                        allKeywords["comKy"][item].push(label)})
                }
                if(hl.length > 0){
                    hl.forEach((item) => {
                        if(!allKeywords["hlKy"].hasOwnProperty(item)){
                            allKeywords["hlKy"][item] = []
                        }
                        allKeywords["hlKy"][item].push(label)})
                }
                if(lky.length > 0){
                    lky.forEach((item) => {
                        if(!allKeywords["llmKy"].hasOwnProperty(item)){
                            allKeywords["llmKy"][item] = []
                        }
                        allKeywords["llmKy"][item].push(label)})
                }
                // if(ohl.length > 0){
                //     ohl.forEach((item) => {
                //         if(!allKeywords["omitKy"].hasOwnProperty(item)){
                //             allKeywords["omitKy"][item] = []
                //         }
                //         allKeywords["omitKy"][item].push(label)})
                // }
            }
        }
    
    console.log(`[${current()}]`+ "[Space2Think] allKeywords", allKeywords)
    dispatch(setKeywords(allKeywords))
    console.log(`[${current()}]`+ "[Space2Think] snapshot", editor.store.getSnapshot())
    return allKeywords;
}