// import { useEditor, Editor, useValue } from 'tldraw'
// import { useEffect } from 'react'
import { current } from '../../LexicalEditor/time';

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

// Helper to extract JSON from model response
function extractJsonFromResponse(response) {
  // Try to extract JSON from a markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    response = codeBlockMatch[1];
  }
  // Fallback: try to find the first { ... } block
  const firstBrace = response.indexOf('{');
  const lastBrace = response.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    response = response.substring(firstBrace, lastBrace + 1);
  }
  return response;
}

export async function reportToSpace (editor, oriReport) {
    const snapshot = editor.store.getSnapshot().store;
    console.log(`[${current()}]`+ "[reportToSpace] blankReport: ", oriReport);
    console.log(`[${current()}]`+ "[reportToSpace] snapshot", snapshot);
    let minX = 999, minY = 999, maxX = 0, maxY = 0;
    for (var item in snapshot){
        if (!snapshot[item].id.includes("shape:")) continue;
        const x = snapshot[item].x;
        const y = snapshot[item].y;
        if (x < minX) minX = x;
        if (x + snapshot[item].props.w > maxX) maxX = x + snapshot[item].props.w;
        if (y < minY) minY = y;
        if (y + snapshot[item].props.h> maxY) maxY = y + snapshot[item].props.h;
    }

    console.log(`[${current()}]`+ "[reportToSpace] maxX", maxX);

    let startX = maxX;
    let startY = minY;

    const report = JSON.parse(oriReport);
    // let cluster = {};
    let newReport = {};
    // newReport["Introduction"] = report["Introduction"];
    newReport["Middle_paragraph"] = [];
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var section in report){
        if (section === "Middle_paragraph"){
            for (var p in report["Middle_paragraph"]){
                let middle = {};
                const files = report["Middle_paragraph"][p]["files"]
                // Split files by ',' and count the number of items, trimming whitespace
                const filesArray = typeof files === 'string' ? files.split(',').map(f => f.trim()) : files;
                const length = filesArray.length;
                // const id = report["Middle_paragraph"][p]["id"]
                const id = "shape:" +  makeid(9);
                // console.log("report['Middle_paragraph'][p]", report["Middle_paragraph"][p]);
                middle["id"] = id;
                middle["name"] = report["Middle_paragraph"][p]["name"];
                middle["summarization"] = report["Middle_paragraph"][p]["summarization"];
                middle["text"] = report["Middle_paragraph"][p]["text"];
                middle["name entities"] = report["Middle_paragraph"][p]["name entities"];
                middle["keywords"] = report["Middle_paragraph"][p]["keywords"];
                newReport["Middle_paragraph"].push(middle);
        
                console.log(`[${current()}]`+ "[reportToSpace] files", filesArray);
                // cluster[id] = files;
                console.log(`[${current()}]`+ "[reportToSpace] length", length);
                let yNum = Math.ceil(length / 4);
                console.log(`[${current()}]`+ "[reportToSpace] yNum", yNum, "length", length);
                // create clusters
                editor.createShapes([{ id: id, type: 'frame', x: startX, y: startY, props: {w: 510 * 4, h: 420 * yNum, name: middle["name"]}}])
                for (var i = 0; i < filesArray.length; i++){
                    const file = filesArray[i];
                    const x = 510 * (i % 4);
                    const y = 420 * Math.floor(i / 4);
                    for (var j in snapshot){
                        if (!snapshot[j].id.includes("shape:")) continue;
                        if (snapshot[j].props.label === file){
                            editor.updateShapes([{id: snapshot[j].id, parentId: id, x: x, y: y}])
                        }
                    }
                }
        
                startY += 400* yNum + 100;
                
                // editor.setCamera({ x: startX*1, y: minY*1, z: 0.5 }, { duration: 200, easing: (t) => t * t });
            }
        }
        else{
            newReport[section] = report[section];
        }
    }

    // const contentWidth = maxX - minX + 510 * 4;
    // const contentHeight = maxY - minY;
    // const centerX = minX - contentWidth / 2;
    // const centerY = minY + contentHeight / 2;

    // editor.setCamera({ x: centerX, y: centerY, z: 0.3 }, { duration: 200, easing: (t) => t * t });
    editor.zoomToFit({ duration: 200, padding: 100 });
    
    // editor.setCamera({ x: startX - 1020, y: startY - 1000, z: 0.3 }, { duration: 200, easing: (t) => t * t });


    // newReport["Conclusion"] = report["Conclusion"];
    const outputReport = JSON.stringify(newReport);
    console.log(`[${current()}]`+ "[reportToSpace] snapshot2", snapshot);

    console.log(`[${current()}]`+ "[reportToSpace] newReport", outputReport);
    console.log(`[${current()}]`+ "[reportToSpace] startX", startX);
    console.log(`[${current()}]`+ "[reportToSpace] minY", minY);
    // editor.setCamera({ x: startX*1, y: minY*1, z: 0.5 }, { duration: 200, easing: (t) => t * t });
    return outputReport;
}
