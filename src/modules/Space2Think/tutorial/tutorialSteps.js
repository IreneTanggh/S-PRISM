// Tutorial steps for Yellowstone National Park exploration
export const tutorialSteps = [
    // {
    //     target: '#toolbar-search',
    //     content: (
    //         <div>
    //             <h3>🔍 Search words</h3>
    //             <p> Search - click input box - input words - click the search results</p>
    //             <img src={'/images/search.gif'} alt="Search" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'bottom',
    //     spotlightClicks: true,
    // },
    {
        target: '#toolbar-report',
        content: (
            <div>
                <h3>📊 Report Generation</h3>
                {/* <p>The <strong>Report Generation</strong> button uses AI to create comprehensive reports based on your analysis of the Yellowstone data.</p> */}
                <p>Using the Frame to represent middle paragraphs of the report.</p>
                <img src={'/images/report_img1.png'} alt="Report" style={{width: '100%', height: 'auto'}} />
                <p>A. Using Frame name to represent the section name of one middle paragraph. B. Highlights to let report include the keywords. C. Note to send your insight. </p>
                <img src={'/images/report_img2.png'} alt="Report" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>🗺️ Workspace</h3>
    //             <p>This is your workspace where you can organize the documents in clusters.</p>
    //         </div>
    //     ),
    //     placement: 'bottom',
    //     spotlightClicks: false,
    // },
    // {
    //     target: '.tlui-menu-zone',
    //     content: (
    //         <div>
    //             {/* <h3>🗺️ Workspace Toolbar</h3> */}
    //             <p>You can click the Redo and Undo button to redo and undo the last action.</p>
    //         </div>
    //     ),
    //     placement: 'bottom',
    //     spotlightClicks: false,
    // },
    // {
    //     target: '.custom-toolbar',
    //     content: (
    //         <div>
    //             <h3>🗺️ Workspace Toolbar</h3>
    //             <p>This is the workspace toolbar where you can select, pin, add frames, add annotations, and delete elements.</p>
    //             <p><strong>Try clicking on different elements to explore!</strong></p>
    //         </div>
    //     ),
    //     placement: 'bottom',
    //     spotlightClicks: false,
    // },
    {
        target: '[aria-label="Select"]',
        content: (
            <div>
                <h3>🗺️ Select</h3>
                {/* <p><b>Keyboard Shortcut: "s"</b></p> */}
                <p> Single click to select one element. Drag to select multiple elements.</p>
                <img src={'/images/select.gif'} alt="Select" style={{width: '100%', height: 'auto'}} />
                {/* <p>You can select elements in the workspace by clicking the "Select" button.</p>
                <p>You can also select multiple elements by clicking and dragging the mouse.</p> */}
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    {
        target: '[aria-label="PanTool"]',
        content: (
            <div>
                <h3>🗺️ Pan</h3>
                <p> click pan - move the canvas</p>
                {/* <p><b>Keyboard Shortcut: "p"</b></p> */}
                <img src={'/images/pan.gif'} alt="Pan" style={{width: '100%', height: 'auto'}} />
                <p>Or keep pushing the middle mouse wheel to move the canvas.</p>
                <img src={'/images/mouse.png'} alt="Pan" style={{width: '50%', height: 'auto'}} />
                <p>You can also pan the workspace by dragging the inner window of the navigator bar.</p>
                <img src={'/images/pan-navigator.gif'} alt="Pan" style={{width: '100%', height: 'auto'}} />
                {/* <p>You can move the canvas in different directions by clicking the "Pan" button.</p> */}
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    {
        target: '[aria-label="Frame"]',
        content: (
            <div>
                <h3>🗺️ Add Frame</h3>
                <p>Create a frame: click "Frame" - click and drag the frame larger than the documents range and you can cover the documents with the frame.</p>
                <img src={'/images/frame_2.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
                <p>Frames can contain documents, notes, or both.</p>
                <img src={'/images/frame-2.png'} alt="Frame" style={{width: '80%', height: 'auto'}} />
            </div>
        ),
        placement: 'right',
        spotlightClicks: false,
    },
    {
        target: '[aria-label="Note"]',
        content: (
            <div>
                <h3>🗺️ Add Note</h3>
                <p> click note - add a note into the frame; double click the note to edit it.</p>
                <img src={'/images/note.gif'} alt="Note" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    {
        target: '[aria-label="Eraser"]',
        content: (
            <div>
                <h3>🗺️ Eraser</h3>
                <p> click Eraser - delete the element it selected; drag the mouse to erase multiple elements.</p>
                <img src={'/images/delete.gif'} alt="Eraser" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    {
        target: '.tl-shape',
        content: (
            <div>
                <h3>🗺️ Highlight in a document</h3>
                <p>Select the text you want to highlight and right click to open the highlight menu.</p>
                <p><strong style={{color: '#28a745'}}>💡 Try it now!</strong></p>
                {/* <img src={'/images/highlight.gif'} alt="Highlight" style={{width: '100%', height: 'auto'}} /> */}
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: true,
    },
    {
        target: '#highlight_tip',
        content: (
            <div>
                <h3>🗺️ Highlight Tip</h3>
                <p>Except your own <b style={{backgroundColor: "#fcfc03"}}>highlight</b>, after report generation, LLM will highlight words in <b style={{backgroundColor: "#5bc8f3"}}>blue</b>.</p>
                <p>The words both highlighted by you and LLM will be in <b style={{backgroundColor: "#4afd65"}}>green</b>.</p>
                <p>Double click on the highlighted words - Right click on mouse - Open the highlight menu to <b style={{backgroundColor: "#4afd65"}}>adopt</b> or <b style={{backgroundColor: "#dddbdb",textDecorationLine: "line-through"}}>omit</b> the LLM highlights.</p>    
                <img src={'/images/highlight-menu.gif'} alt="Highlight Menu" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: false,
    },
    // {
    //     target: '.tlui-navigation-panel',
    //     content: (
    //         <div>
    //             <h3>🗺️ Navigation Panel</h3>
    //             <p>You can pan the workspace by dragging the inner window.</p>
    //             <p><strong style={{color: '#28a745'}}>💡 Try it now!</strong></p>
    //             <img src={'/images/navigator_bar.gif'} alt="Navigation" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'top',
    //     spotlightClicks: true,
    // },
    {
        target: '.editor_space',
        content: (
            <div>
                <h3>🗺️ Keyboard Shortcuts</h3>
                <p>Press "Cmd + +" to zoom in and "Cmd + -" to zoom out.</p>
                <p>"Cmd + c", "Cmd + v", "Cmd + x", "delete" work for any object.</p>
                <p><strong style={{color: '#28a745'}}>💡 Try it now!</strong></p>
            </div>
        ),
        placement: 'bottom',
        spotlightClicks: true,
    },
    // {
    //     target: '.MuiDrawer-paper',
    //     content: (
    //         <div>
    //             <h3>📋 Report Sidebar</h3>
    //             <p>Where you can configure prompts, model settings, and view generated reports. </p>
    //             <p>You can adjust the width of the sidebar by dragging the edge of the sidebar.</p>
    //         </div>
    //     ),
    //     placement: 'left',
    //     spotlightClicks: false,
    // },
    {
        target: '#prompt-settings',
        content: (
            <div>
                <h3>📋 Prompt Settings</h3>
                <img src={'/images/prompt_settings.png'} alt="Prompt Settings" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'left',
        spotlightClicks: false,
    },
    {
        target: '#model-settings',
        content: (
            <div>
                <h3>📋 Model Settings</h3>
                <p>GPT-4o-mini is recommended for lower cost and higher speed.</p>
                <img src={'/images/model_settings.png'} alt="Model Settings" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'left',
        spotlightClicks: true,
    },
    {
        target: '#report-editor',
        content: (
            <div>
                <h3>📋 Report Editor</h3>
                <img src={'/images/report_editor.png'} alt="Report Editor" style={{width: '100%', height: 'auto'}} />
            </div>
        ),
        placement: 'left',
        spotlightClicks: true,
    },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b>Generate the Report</h3>
    //             {/* <p> 💡Follow the tutorial steps to finish the task.</p> */}
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: false,
    // },
    // {
    //     target: '#editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b> </h3>
    //             <p> <b>Step 1:</b> Click the "frame" button to add a frame with 12 documents.</p>
    //             <img src={'/images/1-1.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    //     floaterProps: {
    //         styles: {
    //           floater: { width: 800, maxWidth: 800 } // set this step’s tooltip width
    //         }
    //       }
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 2:</b> Double click the frame name to rename it.</p>
    //             <img src={'/images/1-2.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 3:</b> Click the "note" button to add a note into the frame.</p>
    //             <img src={'/images/1-3.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     floaterProps: {
    //         styles: {
    //           floater: { width: 400, maxWidth: 400 }
    //         }
    //     },
    //     spotlightClicks: true,
    // },
    // // {
    // //     target: '.editor_space',
    // //     content: (
    // //         <div>
    // //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    // //             <p> <b>Step 4:</b> Double click one document in the frame to highlight some text in the document.</p>
    // //             {/* <img src={'/images/1-4.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} /> */}
    // //         </div>
    // //     ),
    // //     placement: 'center',
    // //     spotlightClicks: true,
    // // },
    // {
    //     target: '#toolbar-report',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 4:</b> Click the "REPORT GENERATION" button to generate a report.</p>
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.MuiDrawer-paper',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 5:</b> Wait for the report generation to complete.</p>
    //             <p>Once generation is complete, the Report tab will be automatically opened to view your comprehensive data analysis results!</p>
    //             <img src={'/images/4-llm-running.png'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.MuiDrawer-paper',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 6:</b> Click the highlights, citations, and cluster names in the report after generation is complete.</p>
    //             <img src={'/images/1-5.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task1: </b></h3>
    //             <p> <b>Step 8:</b> Click the highlights, documents, and cluster's edges to in the workspace to locate the corresponding analysis in the report.</p>
    //             <img src={'/images/1-6.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task2: </b>Revise The Report</h3>
    //             {/* <p> 💡Follow the tutorial to finish the task.</p> */}
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: false,
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task2: </b></h3>
    //             <p> <b>Step 1:</b> Click the "frame" button to add a sub cluster to the previous cluster. </p>
    //             <img src={'/images/2-1.gif'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '#toolbar-report',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task2: </b></h3>
    //             <p> <b>Step 2:</b> Click the "REPORT GENERATION" button to generate a revised report.</p>
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.editor_space',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task2: </b></h3>
    //             <p> <b>Step 3:</b> Check the reasoning and planning given by the LLM.</p>
    //             <img src={'/images/2-2.png'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: '.MuiDrawer-paper',
    //     content: (
    //         <div>
    //             <h3>📊 <b style={{color: '#28a745'}}>Tutorial Task2: </b></h3>
    //             <p> <b>Step 4:</b> Wait for the report generation to complete.</p>
    //             <p>The added and modified words will be in <span style={{backgroundColor: '#fcd9d7', color: 'black', textDecoration: 'rgb(244, 25, 25) wavy underline'}}>red</span>.</p>
    //             <img src={'/images/2-3.png'} alt="Frame" style={{width: '100%', height: 'auto'}} />
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: true,
    // },
    // {
    //     target: 'body',
    //     content: (
    //         <div>
    //             <h3>🎉 Tutorial Complete!</h3>
    //         </div>
    //     ),
    //     placement: 'center',
    //     spotlightClicks: false,
    // }
];

// Tutorial configuration
export const tutorialConfig = {
    title: "System Tutorial",
    description: "Learn how to explore and analyze data using Space2Think",
    estimatedTime: "5-10 minutes",
    difficulty: "Beginner",
    dataset: "Yellowstone National Park",
    features: [
        "Interactive workspace navigation",
        "Document search and highlighting",
        "AI-powered report generation",
        "Customizable analysis settings",
        "Work saving and loading"
    ]
}; 