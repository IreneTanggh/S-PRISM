import React, { 
    useState, 
    useEffect, 
    useRef,
    createContext
 } from 'react';

// import Menus from '../Tldraw/Menus.tsx'
import MenuComponents from '../Tldraw/Menus.tsx'
import customShape from '../Tldraw/DangerousHtmlShape.tsx'

import {
    useDispatch,
    useSelector
} from 'react-redux';

import ExampleTheme from '../LexicalEditor/themes/ExampleTheme.js'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'

import Drawer from '@mui/material/Drawer'
import Grow from '@mui/material/Grow';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import SearchIcon from '@mui/icons-material/Search';
import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyIcon from '@mui/icons-material/Key';
import { hardReset } from 'tldraw';
import { ApiKeyDialog } from './space/apiKeyDialog.js';


import {
    setReport,
    setUserKeywords,
    setCurClickedNodeKey,
    setPreReport,
    setPreSnapshot,
    addToReportHistory,
    clearReportHistory,
    setModifiedGeneration,
    setCurrentSnapshot,
} from '../LexicalEditor/slices/EditorSlice.js'

import {
setModifiedJson,
setModifiedState,
} from '../LexicalEditor/slices/EditorSlice.js'
import { showModifications } from "./api/showModification.js";

// import 'reactflow/dist/style.css';
import './style.css';
import tutorial from './dataset/tutorial.js'
import yellowstoneShape from './dataset/yellowstone.js'
import crescentShape from './dataset/crescent.js'
import yellowstoneCluster from './dataset/yellowstone_cluster_2.json'
import crescentCluster from './dataset/crescent_cluster.json'
// import tutorialCluster from './dataset/tutorial_cluster.json'
// comment it when you are debugging

import {Box, Button, Stack, Typography, Tooltip, Popper, Paper, MenuList, MenuItem, ClickAwayListener, TextField, Tab, Tabs, Divider} from '@mui/material';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined'
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined'
import ReportEditor from '../LexicalEditor/ReportEditor.js';
import { styled } from '@mui/material/styles'
import MuiAppBar from '@mui/material/AppBar'
import {Tldraw, useValue} from 'tldraw'

import {
    setDrawerClose,
    setDrawerOpen,
    setSelectedId,
    setSelectedEntity,
    setSelectedContainerClass,
    setReportOpen,
    setReportClose,
    setRefineReactMessage,
    setReportRefineSettings,
    setPreviousReportRefineSettings,
    setPreviousReportStructure,
    setTaskDescription,
    setReportStructure,
    setPreviousTaskDescription,
    setDefaultTaskDescription,
    setDefaultReportStructure,
} from '../LexicalEditor/slices/SpaceSlice.js'
import { useLocation } from 'react-router-dom';
import CustomUi from '../Tldraw/CustomUI.tsx';
import { reportGeneration} from './api/ReportGeneration.tsx';
import { reportGenerationBlank} from './api/ReportGenerationBlank.tsx';
import { reportRefinement} from './api/ReportRefinement.tsx';
import { reportToSpace } from './space/reportToSpace.js';
import { keywordsToST } from './space/keywordToSpace.js';
import { reportToClusterName } from './space/reportToClusterName.js';
import { PromptTab } from './space/PromptTab.js';
import { current } from '../LexicalEditor/time.js';
import ChatBot from './ChatBot.tsx';
import { logger } from '../../utils/logger.js';
import TutorialManager from './tutorial';
import { setPreSelectedShape } from '../LexicalEditor/slices/SpaceSlice.js';


// Helper function to ensure all store items have meta property to prevent validation errors
const ensureMetaProperty = (data) => {
    console.log("enter ensureMetaProperty");
    // Handle null/undefined data
    if (!data) {
        return data;
    }
    console.log("data.store", data.store);
    for (const key in data.store) {
        console.log("key", key);
        if (!data.store[key].hasOwnProperty('meta')) {
            data.store[key].meta = {};
        }
    }
    return data;
    
};

// Helper function to convert txt files to shapes
const convertTxtFilesToShapes = (files) => {
    return new Promise((resolve, reject) => {
        const shapes = [];
        let filesProcessed = 0;
        
        if (files.length === 0) {
            resolve(shapes);
            return;
        }
        
        Array.from(files).forEach((file, index) => {
            const fileReader = new FileReader();
            
            fileReader.onload = (event) => {
                try {
                    const content = event.target.result;
                    // Extract filename without extension for label
                    const fileName = file.name.replace(/\.[^/.]+$/, "");
                    
                    // Create shape similar to task1.js pattern
                    const shape = {
                        type: 'xx_html',
                        x: 120,
                        y: 120,
                        props: {
                            w: 500,
                            h: 400,
                            label: fileName,
                            content: content,
                        }
                    };
                    
                    shapes.push(shape);
                    filesProcessed++;
                    
                    // When all files are processed, resolve with shapes
                    if (filesProcessed === files.length) {
                        resolve(shapes);
                    }
                } catch (error) {
                    console.error(`[${current()}] Error processing file ${file.name}:`, error);
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        resolve(shapes); // Resolve with whatever shapes we successfully processed
                    }
                }
            };
            
            fileReader.onerror = () => {
                console.error(`[${current()}] Error reading file ${file.name}`);
                filesProcessed++;
                if (filesProcessed === files.length) {
                    resolve(shapes);
                }
            };
            
            fileReader.readAsText(file, "UTF-8");
        });
    });
};

// Navigation prevention utilities
const preventNavigation = (event) => {
    // Prevent default browser navigation for touchpad gestures
    if (event.type === 'popstate') {
        event.preventDefault();
        // Restore the current state
        window.history.pushState(null, '', window.location.href);
        return false;
    }
    
    // For beforeunload, show a warning if there are unsaved changes
    if (event.type === 'beforeunload') {
        const hasUnsavedChanges = false; // You can implement logic to check for unsaved changes
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '';
            return '';
        }
    }
};

// Add ModelSettings import (create placeholder below if not found)
function ModelSettings({ settings, setSettings }) {
  const handleChange = async(e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    console.log(`[${current()}]`+ "[ModelSettings] settings", settings);
    await logger.logUserAction("[ModelSettings] settings", {details: settings});
  };
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Model Settings
      </Typography>
      {/* 1. Initial report generation section */}
      {/* <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold', mb: 2 }}>1. Report Generation from Unstructured Space</Typography>
      <TextField
        select
        fullWidth
        label="Model"
        name="reportGenerationBlankModel"
        value={settings.reportGenerationBlankModel}
        onChange={handleChange}
        SelectProps={{ native: true }}
        sx={{ mb: 2 }}
      >
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-4o-mini">gpt-4o-mini</option>
        <option value="gpt-4.1">gpt-4.1</option>
        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
      </TextField>
      <Typography variant="body2" sx={{ mb: 1 }}>Parameters</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="number"
          name="max_tokens"
          label={getMaxTokensLabel(settings.reportGenerationBlankModel)}
          value={settings.max_tokens}
          onChange={handleChange}
          inputProps={{ min: 100, max: 32000 }}
          size="small"
          sx={{ minWidth: 160 }}
        /> */}
        {/* <Tooltip title={getTemperatureTooltip(settings.reportGenerationBlankModel)} arrow placement="top">
          <span style={{ width: '100%' }}>
            <TextField
              type="number"
              name="temperature"
              label="Temperature"
              value={settings.temperature}
              onChange={handleChange}
              inputProps={{ min: 0, max: 2, step: 0.01 }}
              size="small"
              disabled={!supportsTemperature(settings.reportGenerationBlankModel)}
              sx={{ minWidth: 160, backgroundColor: !supportsTemperature(settings.reportGenerationBlankModel) ? '#f0f0f0' : undefined }}
            />
          </span>
        </Tooltip>
      </Stack>
      <Divider sx={{ my: 2 }} /> */}
      {/* 2. Report generation section */}
      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold', mb: 2 }}>1. Report Generation from Structured Space</Typography>
      <TextField
        select
        fullWidth
        label="Model"
        name="reportGenerationModel"
        value={settings.reportGenerationModel}
        onChange={handleChange}
        SelectProps={{ native: true }}
        sx={{ mb: 2 }}
      >
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-4o-mini">gpt-4o-mini</option>
        <option value="gpt-4.1">gpt-4.1</option>
        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
        {/* <option value="gpt-5">gpt-5</option>
        <option value="gpt-5-mini">gpt-5-mini</option> */}
      </TextField>
      <Typography variant="body2" sx={{ mb: 1 }}>Parameters</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="number"
          name="max_tokens"
          label={getMaxTokensLabel(settings.reportGenerationModel)}
          value={settings.max_tokens}
          onChange={handleChange}
          inputProps={{ min: 100, max: 32000 }}
          size="small"
          sx={{ minWidth: 160 }}
        />
        <Tooltip title={getTemperatureTooltip(settings.reportGenerationModel)} arrow placement="top">
          <span style={{ width: '100%' }}>
            <TextField
              type="number"
              name="temperature"
              label="Temperature"
              value={settings.temperature}
              onChange={handleChange}
              inputProps={{ min: 0, max: 2, step: 0.01 }}
              size="small"
              disabled={!supportsTemperature(settings.reportGenerationModel)}
              sx={{ minWidth: 160, backgroundColor: !supportsTemperature(settings.reportGenerationModel) ? '#f0f0f0' : undefined }}
            />
          </span>
        </Tooltip>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {/* 3. Report refinement section */}
      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold', mb: 2 }}>2. Report Refinement</Typography>
      <TextField
        select
        fullWidth
        label="Reasoning Model"
        name="reportRefinementReasoningModel"
        value={settings.reportRefinementReasoningModel}
        onChange={handleChange}
        SelectProps={{ native: true }}
        sx={{ mb: 2 }}
      >
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-4o-mini">gpt-4o-mini</option>
        {/* <option value="o1">o1</option>
        <option value="o3-mini">o3-mini</option>
        <option value="o3">o3</option>
        <option value="o4-mini">o4-mini</option> */}
        <option value="gpt-4.1">gpt-4.1</option>
        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
      </TextField>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="number"
          name="refinementReasoningMaxTokens"
          label={getMaxTokensLabel(settings.reportRefinementReasoningModel)}
          value={settings.refinementReasoningMaxTokens}
          onChange={handleChange}
          inputProps={{ min: 100, max: 32000 }}
          size="small"
          sx={{ minWidth: 160 }}
        />
        <Tooltip title={getTemperatureTooltip(settings.reportRefinementReasoningModel)} arrow placement="top">
          <span style={{ width: '100%' }}>
            <TextField
              type="number"
              name="refinementReasoningTemperature"
              label="Temperature"
              value={settings.refinementReasoningTemperature}
              onChange={handleChange}
              inputProps={{ min: 0, max: 2, step: 0.01 }}
              size="small"
              disabled={!supportsTemperature(settings.reportRefinementReasoningModel)}
              sx={{ minWidth: 160, backgroundColor: !supportsTemperature(settings.reportRefinementReasoningModel) ? '#f0f0f0' : undefined }}
            />
          </span>
        </Tooltip>
      </Stack>
      <TextField
        select
        fullWidth
        label="Refinement Model"
        name="reportRefinementModel"
        value={settings.reportRefinementModel}
        onChange={handleChange}
        SelectProps={{ native: true }}
        sx={{ mb: 2 }}
      >
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-4o-mini">gpt-4o-mini</option>
        <option value="gpt-4.1">gpt-4.1</option>
        <option value="gpt-4.1-mini">gpt-4.1-mini</option>
      </TextField>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          type="number"
          name="refinementRefineMaxTokens"
          label={getMaxTokensLabel(settings.reportRefinementModel)}
          value={settings.refinementRefineMaxTokens}
          onChange={handleChange}
          inputProps={{ min: 100, max: 32000 }}
          size="small"
          sx={{ minWidth: 160 }}
        />
        <Tooltip title={getTemperatureTooltip(settings.reportRefinementModel)} arrow placement="top">
          <span style={{ width: '100%' }}>
            <TextField
              type="number"
              name="refinementRefineTemperature"
              label="Temperature"
              value={settings.refinementRefineTemperature}
              onChange={handleChange}
              inputProps={{ min: 0, max: 2, step: 0.01 }}
              size="small"
              disabled={!supportsTemperature(settings.reportRefinementModel)}
              sx={{ minWidth: 160, backgroundColor: !supportsTemperature(settings.reportRefinementModel) ? '#f0f0f0' : undefined }}
            />
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
}

function getMaxTokensLabel(model) {
  if (!model) return 'Max Tokens';
  if (model.startsWith('gpt-') || model.startsWith('oai-')) return 'max_tokens';
  if (model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) return 'max_completion_tokens';
  return 'Max Tokens';
}

function supportsTemperature(model) {
  return model && (model.startsWith('gpt-') || model.startsWith('oai-'));
}

function getTemperatureTooltip(model) {
  if (!supportsTemperature(model)) {
    return 'Temperature is not supported for this model.';
  }
  return '';
}

// At the top of your file
const originalConsoleError = console.error;


function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
  }

console.error = (...args) => {
    if (
        args.length === 1 &&
        typeof args[0] === 'string' &&
        args[0].includes('ResizeObserver loop completed with undelivered notifications')
    ) {
        return;
    }
    originalConsoleError(...args);
};

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

const Main = styled('main', { shouldForwardProp: (prop) => !['open', 'drawerWidth'].includes(prop) })(
    ({ theme, open, drawerWidth }) => ({
      flexGrow: 1,
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      marginTop: '46px',
      ...(open && {
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen
        }),
        marginRight: `${drawerWidth}px`,
      })
    })
  );
  
const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => !['open', 'drawerWidth'].includes(prop)
})(({ theme, open, drawerWidth }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    height: '46px',
    backgroundColor: '#fff',
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginRight: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      })
    })
}));

let id = 1;
const getId = () => 'Group' + String(id++);

const editorContext = createContext({});


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
    //   HighlightDepNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    //   TextBlockNode
    ]
  }

function recordSnapshot(snapshot) {
    console.log(`[${current()}]`+ " [Space2Think] snapshot per minute", snapshot);
}
  
function ChatBotTab({ editorRef, currentDataset }) {
  return (
    <Box sx={{ height: 'calc(100vh - 150px)' }}>
      <ChatBot editorRef={editorRef} currentDataset={currentDataset}/>
    </Box>
  );
}

export default function Space() {
    const dispatch = useDispatch();
    const location = useLocation();
    const drawerOpen = useSelector(state => state.space.drawerOpen);
    const condition = useSelector(state => state.editor.condition)
    const [menuOpen, setMenuOpen] = useState(false);
    const [sMenuOpen, setSMenuOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    const anchorRef = useRef(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clearContent, setClearContent] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportFinish, setReportFinish] = useState(false);
    const [frameErrorOpen, setFrameErrorOpen] = useState(false);
    const curClickedNodeKey = useSelector(state => state.editor.curClickedNodeKey);
    const curClickedCiteKey = useSelector(state => state.editor.curClickedCiteKey);
    const highlightDoc = useSelector(state => state.space.highlightDoc);
    const [prehlDoc, setprehlDoc] = useState(null);
    const keywords = useSelector(state => state.editor.keywords);
    const report = useSelector(state => state.editor.report);
    const reportOpen = useSelector(state => state.space.reportOpen);
    const taskDescription = useSelector(state => state.space.taskDescription);
    const reportStructure = useSelector(state => state.space.reportStructure);
    const selectedEntity = useSelector(state => state.space.selectedEntity);
    const selectedCite = useSelector(state => state.space.selectedCite);
    const selectedContainerClass = useSelector(state => state.space.selectedContainerClass);
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const preReport = useSelector(state => state.editor.preReport);
    const preSnapshot = useSelector(state => state.editor.preSnapshot);
    const modifiedState = useSelector(state => state.editor.modifiedState);
    const modifiedJson = useSelector(state => state.editor.modifiedJson);
    const reportHistory = useSelector(state => state.editor.reportHistory)

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const yPos = useRef(0);
    const xPos = useRef(0);
    const dragRef = useRef(null);
    const [target, setTarget] = useState(null);
    const [selectedText, setSelectedText] = useState('');
    const selectedNode = useRef(null);
    const [isBold, setIsBold] = useState(false)
    const nodePos = useRef({x: 0, y: 0});

    const [editor, setEditor] = useState(null);
	const currentToolId = useValue('current tool id', () => editor?.getCurrentToolId(), [editor])
    const snapshot = useValue('snapshot', () => editor?.store.getSnapshot(), [editor]);
    const editorRef = useRef(null);
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
    const [apiKeyError, setApiKeyError] = useState('');
    const [reportApiError, setReportApiError] = useState('');
    
    // Auto-open task functionality
    const autoOpenTask = location.state?.autoOpenTask;
    const [hasAutoOpened, setHasAutoOpened] = useState(false);

    const [drawerWidth, setDrawerWidth] = useState(window.innerWidth * 0.3);
    const [isResizing, setIsResizing] = useState(false);
    const modifiedGeneration = useSelector(state => state.editor.modifiedGeneration);
    const refineReactMessage = useSelector(state => state.space.refineReactMessage);
    const [isReactDone, setIsReactDone] = useState(false);
    const prevLoadingRef = useRef();
    const reportRefineSettings = useSelector(state => state.space.reportRefineSettings);
    const previousReportStructure = useSelector(state => state.space.previousReportStructure);
    const previousReportRefineSettings = useSelector(state => state.space.previousReportRefineSettings);
    const previousTaskDescription = useSelector(state => state.space.previousTaskDescription);
    const defaultTaskDescription = useSelector(state => state.space.defaultTaskDescription);
    const defaultReportStructure = useSelector(state => state.space.defaultReportStructure);

    // Update the resize handlers
    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 200 && newWidth < window.innerWidth * 0.8) {
                setDrawerWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Auto-open task when component mounts
    useEffect(() => {
        if (editor && !hasAutoOpened) {
            setHasAutoOpened(true);
            
            // Clear existing content
            editor?.selectAll();
            editor?.deleteShapes(editor?.getSelectedShapeIds());
            editor?.selectNone();
            dispatch(setReport(''));
            dispatch(setPreReport(''));
            dispatch(clearReportHistory());
            dispatch(setModifiedGeneration(false));

            // Load yellowstone by default, or the specified task if autoOpenTask is set
            if (autoOpenTask === 'tutorial') {
                // dispatch(setTaskDescription(defaultTaskDescription));
                // dispatch(setReportStructure(defaultReportStructure));
                // editor?.store.loadSnapshot(tutorialCluster);
                // editor?.updateInstanceState({ isFocused: true })
                // editor.zoomToFit({ duration: 500, padding: 100 });
                // logger.info("DATASET", 'tutorial_cluster');
            } else if (autoOpenTask === 'task1') {
                // shift task2 with task1
                dispatch(setTaskDescription(defaultTaskDescription));
                dispatch(setReportStructure(defaultReportStructure));
                editor?.store.loadSnapshot(crescentCluster);
                editor?.updateInstanceState({ isFocused: true })
                editor.zoomToFit({ duration: 500, padding: 100 });
                logger.info("DATASET", 'crescent_cluster');
            } else {
                // Default: load yellowstone dataset
                const yellowstoneDescription = "";
                // const yellowstoneDescription = "You are researching for an upcoming trip. I'm providing you with a collection of structured text about Yellowstone National Park. Your goal is to synthesize this information into a coherent summary report that highlights key insights about the park's characteristics, with each point supported by evidence from the provided text.";
                const yellowstoneStructure = [
                    { id: 'introduction', label: 'Introduction', value: `Provide a "Bottom Line Up Front" (BLUF) executive summary in one paragraph. Answer: "What should a first-time visitor to Yellowstone know?" Synthesize the most critical findings about planning, safety, attractions, and logistics into actionable takeaways.` },
                    { id: 'clusterDescription', label: 'Cluster Analysis', value: `For each major topic (attractions, logistics, safety, etc.), provide: 1) One-sentence overview, 2) Detailed analysis covering What (key features/activities), Where (specific locations), When (best timing/seasons), and Who (target visitor types).`},
                    { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: `Analyze subtopics within each main category. Highlight specific relationships, practical considerations, and insider insights that enhance the visitor experience.`},
                    { id: 'conclusion', label: 'Conclusion', value: `Synthesize how different aspects of Yellowstone connect to create an optimal visit strategy. Focus on: 1) How timing, location choices, and activities interconnect, 2) Key decision points for first-time visitors, 3) Potential challenges and how to mitigate them.` },
                ];
                dispatch(setTaskDescription(yellowstoneDescription));
                dispatch(setReportStructure(yellowstoneStructure));
                dispatch(setDefaultTaskDescription(yellowstoneDescription));
                dispatch(setDefaultReportStructure(yellowstoneStructure));
                editor?.store.loadSnapshot(yellowstoneCluster);
                editor?.updateInstanceState({ isFocused: true })
                editor.zoomToFit({ duration: 500, padding: 100 });
                logger.info("DATASET", 'yellowstone_cluster');
            }
        }
    }, [editor, autoOpenTask, hasAutoOpened, dispatch, logger]);

    // Check for API key on component mount and open dialog if missing
    useEffect(() => {
        // Use a small timeout to ensure DOM is ready
        const checkApiKey = () => {
            const apiKey = localStorage.getItem('openai_key_risky_but_cool');
            const apiKeyInput = document.getElementById('openai_key_risky_but_cool');
            
            // Check if we have a valid API key in localStorage or hidden input
            const hasApiKeyInStorage = apiKey && apiKey.trim() !== '';
            const hasApiKeyInInput = apiKeyInput && apiKeyInput.value && apiKeyInput.value.trim() !== '';
            const hasApiKey = hasApiKeyInStorage || hasApiKeyInInput;
            
            console.log('[Space2Think] API Key Check:', {
                hasApiKeyInStorage,
                hasApiKeyInInput,
                hasApiKey,
                willOpenDialog: !hasApiKey
            });
            
            if (!hasApiKey) {
                setApiKeyDialogOpen(true);
            }
        };
        
        // Check immediately and also after a brief delay to catch any async initialization
        checkApiKey();
        const timeoutId = setTimeout(checkApiKey, 100);
        
        return () => clearTimeout(timeoutId);
    }, []); // Empty dependency array means this runs once on mount

    // menu for file reading
    const handleToggle = () => {
        setMenuOpen(!menuOpen);
    }

    const handleClose = (event) => {
        setMenuOpen(false);
    };

    const handleSToggle = () => {
        setSMenuOpen(!sMenuOpen);
    };
    
    const handleSClose = () => {
        setSMenuOpen(false);
    };

    const handleSOpen = () => {
        setSMenuOpen(true);
    };

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const clearContentAgree = () => {
        setClearContent(true);
    };

    const clearContentCancel = () => {
        setClearContent(false);
    };

    function handleListKeyDown(event) {
        if (event.key === 'Tab') {
          event.preventDefault();
          setMenuOpen(false);
          setSMenuOpen(false);
        } else if (event.key === 'Escape') {
            setMenuOpen(false);
            setClearContent(false);
        }
    }

    function saveSnapshot(data) {
        if(!data) {
            console.error('No data to save');
            return;
        }

        const filename = 'textspire.json';
        
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

    function jsonFileUpload (e) {
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
          const data = JSON.parse(e.target.result);
          console.log(`[${current()}]`+ "[Space to Think] Json Data", data);
          return data;
        };
    }

    function simplifyStrings(str1) {
        // Remove punctuation and special characters
        return str1.replace(/[^\w\s]/g, '').replace(/\s+/g, '').toLowerCase().trim();
    }


    function extractUserKeywords(snapshot){
        const keywords = {}
        keywords["userKy"] = []
        keywords["llmKy"] = []
        keywords["omitKy"] = []
        for (var item in snapshot.store){
            if(snapshot.store[item].type === "xx_html"){
                const hl = snapshot.store[item].props.highlight;
                const chl = snapshot.store[item].props.commonhl;
                const llmky = snapshot.store[item].props.llmhighlight;
                const omitky = snapshot.store[item].props.omithl;

                hl.forEach((word) => {
                    if (!keywords["userKy"].includes(word)){
                        keywords["userKy"].push(word)
                    }
                })

                chl.forEach((word) => {
                    if (!keywords["userKy"].includes(word)){
                        keywords["userKy"].push(word)
                    }   
                })

                llmky.forEach((word) => {
                    if (!keywords["llmKy"].includes(word)){
                        keywords["llmKy"].push(word)
                    }
                })

                omitky.forEach((word) => {
                    if (!keywords["omitKy"].includes(word)){
                        keywords["omitKy"].push(word)
                    }
                })

                // keywords["userKy"] = keywords["userKy"].concat(hl);
                // keywords["userKy"] = keywords["userKy"].concat(chl);
                // keywords["llmKy"] = keywords["llmKy"].concat(llmky);
                // keywords["omitKy"] = keywords["omitKy"].concat(omitky);
            }
        }
        console.log(`[${current()}]`+ "[Space2Think] keywords", keywords)
        return keywords
    }


    // return focus to the button when we transitioned from !open -> open
    const prevOpen = React.useRef(menuOpen);
    React.useEffect(() => {
        if (prevOpen.current === true && menuOpen === false) {
        anchorRef.current.focus();
        }

        prevOpen.current = menuOpen;
    }, [menuOpen]);
    
    const prevOpenS = React.useRef(sMenuOpen);
    React.useEffect(() => {
        if (prevOpenS.current === true && sMenuOpen === false) {
        anchorRef.current.focus();
        }

        prevOpenS.current = sMenuOpen;
    }, [sMenuOpen]);


    function getCamera(){
        return editor?.getCamera();
    }
        
    // }, [drawerOpen]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [search]);

    // useEffect(() => {
    //     if (snapshot !== null && snapshot !== undefined){   
    //     for (var item in snapshot.store){
    //         if(snapshot.store[item].type === "xx_html"){
    //             editor?.updateShape({
    //                 id: snapshot.store[item].id,
    //                 type: 'xx_html',
    //                 props: {
    //                     ...snapshot.store[item].props,
    //                     searchhl: [],
    //                 }
    //             });
    //             }
    //         }
    //         setSearchResult([]);
    //     }
    // }, [editor?.getEditingShapeId()]);

    useEffect(() => {
        // show all docs contain the searched words
        // highlight those words in the docs
        // make the camera move for all the docs - another function
        const logSearch = async () => {
            if (snapshot !== null && snapshot !== undefined){
                if (debouncedSearch !== ''){
                    let searchedDoc = [];
                    console.log(`[${current()}]`+ "[Space2Think] search", debouncedSearch);
                    await logger.logUserAction("[Space2Think] search", {details: debouncedSearch});
                    
                    // Clear previous search highlights
                    for (var item in snapshot.store){
                        if(snapshot.store[item].type === "xx_html"){
                            editor?.updateShape({
                                id: snapshot.store[item].id,
                                type: 'xx_html',
                                props: {
                                    ...snapshot.store[item].props,
                                    searchhl: [],
                                }
                            });
                        }
                    }
                    
                    let searchDict = {};
                    for (var item in snapshot.store){
                        if(snapshot.store[item].type === "xx_html"){
                            const id = item;
                            const content = snapshot.store[item].props.content.toLowerCase();
                            const str = debouncedSearch.toLowerCase();
                            const name = snapshot.store[item].props.label;
                            // Get the shape data
                            const shape = snapshot.store[item];
                            console.log(`[${current()}]`+ "[Space2Think] Shape data for", name, ":", shape);
                            
                            let positionX = shape.x;
                            let positionY = shape.y;
                            
                            // Debug position calculation
                            console.log(`[${current()}]`+ "[Space2Think] Original position for", name, ":", positionX, positionY);
                            
                            // Ensure position values are numbers
                            if (typeof positionX !== 'number' || isNaN(positionX)) {
                                console.warn(`[${current()}]`+ "[Space2Think] Invalid positionX for", name, ":", positionX, "type:", typeof positionX);
                                positionX = 0; // Default fallback
                            }
                            if (typeof positionY !== 'number' || isNaN(positionY)) {
                                console.warn(`[${current()}]`+ "[Space2Think] Invalid positionY for", name, ":", positionY, "type:", typeof positionY);
                                positionY = 0; // Default fallback
                            }
                            
                            if (shape.parentId !== null && shape.parentId !== undefined){
                                const parentId = shape.parentId;
                                const parentShape = snapshot.store[parentId];
                                console.log(`[${current()}]`+ "[Space2Think] Parent shape for", name, ":", parentShape);
                                
                                if (parentShape && typeof parentShape.x === 'number' && typeof parentShape.y === 'number' && 
                                    !isNaN(parentShape.x) && !isNaN(parentShape.y)) {
                                    positionX = parentShape.x + positionX;
                                    positionY = parentShape.y + positionY;
                                    console.log(`[${current()}]`+ "[Space2Think] Parent position for", name, ":", parentShape.x, parentShape.y);
                                    console.log(`[${current()}]`+ "[Space2Think] Final position for", name, ":", positionX, positionY);
                                }
                                // else {
                                //     console.warn(`[${current()}]`+ "[Space2Think] Invalid parent position for", name, "parentId:", parentId, "parentShape:", parentShape);
                                // }
                            }
                            if (content.includes(str)){
                                // Highlight the searched word in this document
                                const searchhl = [str];
                                editor?.updateShape({
                                    id: snapshot.store[item].id,
                                    type: 'xx_html',
                                    props: {
                                        ...snapshot.store[item].props,
                                        searchhl: searchhl,
                                    }
                                });
                                
                                var searchItem = {};
                                const position = content.indexOf(str);
                                const length = str.length;
                                const rest = parseInt((30 - length)/2, 10);
                                searchItem = {
                                    "id": id, 
                                    "content": "..." + content.substring(position-rest, position+rest) + "...",
                                    "name": name,
                                    "positionX": positionX,
                                    "positionY": positionY,
                                }
                                searchDict[id] = searchItem;
                                // console.log(`[${current()}]`+ "[Space2Think] searchItem position", searchItem.positionX, searchItem.positionY)
                                searchedDoc.push(searchItem);
                            }
                        }
                    }
                    setSearchResult(searchedDoc);   
                    console.log(`[${current()}]`+ "[Space2Think] searchedDoc", searchedDoc)     
                    await logger.logUserAction('[Space2Think] searchedDoc', {details: searchedDoc});
                    editor?.select(...Object.keys(searchDict));
                    editor.zoomToSelection({ animation: { duration: 500 } });
                    
                    // // If there are search results, move camera to show all of them
                    // if (searchedDoc.length > 0 && editor) {
                    //     // Calculate the bounding box of all search results
                    //     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        
                    //     console.log(`[${current()}]`+ "[Space2Think] Search results for camera calculation:", searchedDoc);
                        
                    //     searchedDoc.forEach(item => {
                    //         console.log(`[${current()}]`+ "[Space2Think] Processing item:", item.name, "position:", item.positionX, item.positionY);
                    //         if (item.positionX !== undefined && item.positionY !== undefined && 
                    //             !isNaN(item.positionX) && !isNaN(item.positionY)) {
                    //             minX = Math.min(minX, item.positionX);
                    //             minY = Math.min(minY, item.positionY);
                    //             maxX = Math.max(maxX, item.positionX + 400); // Assuming document width
                    //             maxY = Math.max(maxY, item.positionY + 300); // Assuming document height
                    //             console.log(`[${current()}]`+ "[Space2Think] Updated bounds - minX:", minX, "minY:", minY, "maxX:", maxX, "maxY:", maxY);
                    //         } else {
                    //             console.warn(`[${current()}]`+ "[Space2Think] Invalid position for item:", item.name, "position:", item.positionX, item.positionY);
                    //         }
                    //     });
                        
                    //     console.log(`[${current()}]`+ "[Space2Think] Final bounds - minX:", minX, "minY:", minY, "maxX:", maxX, "maxY:", maxY);
                        
                    //     if (minX !== Infinity && minY !== Infinity && !isNaN(minX) && !isNaN(minY)) {
                    //         const centerX = (minX + maxX) / 2;
                    //         const centerY = (minY + maxY) / 2;
                    //         const width = maxX - minX;
                    //         const height = maxY - minY;
                    //         const maxDimension = Math.max(width, height);
                            
                    //         // Calculate zoom level to fit all results
                    //         const zoom = Math.min(800 / maxDimension, 1.5);
                            
                    //         const cameraX = -centerX + (drawerOpen ? 200 : 400);
                    //         const cameraY = -centerY + 300;
                    //         const cameraZ = 1;
                    //         console.log(`[${current()}]`+ "[Space2Think] Moving camera to show all search results");
                    //         console.log(`[${current()}]`+ "[Space2Think] Center calculation - centerX:", centerX, "centerY:", centerY);
                    //         console.log(`[${current()}]`+ "[Space2Think] Moving camera to:", cameraX, cameraY, cameraZ);
                    //         editor.setCamera(
                    //             { x: cameraX, y: cameraY, z: zoom }, 
                    //             { duration: 800, easing: (t) => t * t }
                    //         );
                    //     } else {
                    //         // Fallback: just select all search result items if we can't calculate camera position
                    //         console.log(`[${current()}]`+ "[Space2Think] Cannot calculate camera position, selecting search results instead");
                    //         const validItems = searchedDoc.filter(item => 
                    //             item.id && typeof item.positionX === 'number' && typeof item.positionY === 'number' && 
                    //             !isNaN(item.positionX) && !isNaN(item.positionY)
                    //         );
                    //         if (validItems.length > 0) {
                    //             const itemIds = validItems.map(item => item.id);
                    //             editor.select(...itemIds);
                    //         }
                    //     }
                    // }
                } else {
                    // Clear search highlights when search is empty
                    for (var item in snapshot.store){
                        if(snapshot.store[item].type === "xx_html"){
                            editor?.updateShape({
                                id: snapshot.store[item].id,
                                type: 'xx_html',
                                props: {
                                    ...snapshot.store[item].props,
                                    searchhl: [],
                                }
                            });
                        }
                    }
                    setSearchResult([]);
                }
            }
        };
        logSearch();
    }, [debouncedSearch]);

    useEffect(() => {
        if (!sMenuOpen){
            setSearch('');
            setSearchResult([]);
            // Clear search highlights when search menu is closed
            if (snapshot !== null && snapshot !== undefined){
                for (var item in snapshot.store){
                    if(snapshot.store[item].type === "xx_html"){
                        editor?.updateShape({
                            id: snapshot.store[item].id,
                            type: 'xx_html',
                            props: {
                                ...snapshot.store[item].props,
                                searchhl: [],
                            }
                        });
                    }
                }
            }
        }
    }, [sMenuOpen]);

    useEffect(() => {
        setIsReactDone(true);
        console.log(`[${current()}]`+ "[Space2Think] refineReactMessage", refineReactMessage)
        console.log(`[${current()}]`+ "[Space2Think] refineReactMessage Space_reasoning", refineReactMessage.Space_reasoning)
        console.log(`[${current()}]`+ "[Space2Think] refineReactMessage Prompt_reasoning", refineReactMessage.Prompt_reasoning)
        console.log(`[${current()}]`+ "[Space2Think] refineReactMessage Space_command", refineReactMessage.Space_command)
        console.log(`[${current()}]`+ "[Space2Think] refineReactMessage Prompt_command", refineReactMessage.Prompt_command)
        
        // Handle async logging separately
        if (refineReactMessage && Object.keys(refineReactMessage).length > 0) {
            logger.logUserAction("[Space2Think] refineReactMessage", {details: refineReactMessage});
        }
    }, [refineReactMessage]);

    useEffect(() => {
        // Only run when loading transitions from true to false and isReactDone is true
        if (prevLoadingRef.current && !loading && isReactDone) {
          const timer = setTimeout(() => setIsReactDone(false), 60000); // 60 seconds
          return () => clearTimeout(timer);
        }
        prevLoadingRef.current = loading;
      }, [loading, isReactDone]);

    useEffect(() => {
        const handleReportClick = async () => {
            let x = 0;
            let y = 0;
            if (snapshot !== null && snapshot !== undefined && curClickedNodeKey !== null && curClickedNodeKey !== undefined){
                console.log(`[${current()}]`+ "[Space2Think] curClickedNodeKey", curClickedNodeKey)
                if (curClickedNodeKey.includes('shape')) {
                    // section node
                    console.log(`[${current()}]`+ "[Space2Think] curClickedNodeKey is frame", curClickedNodeKey)
                    await logger.logUserAction("[Space2Think] curClickedNodeKey is frame", {details: curClickedNodeKey});
                    // add logic for subclusters
                    // for (var item in snapshot.store){
                    //     if(snapshot.store[item].type==="frame" && snapshot.store[item].id === curClickedNodeKey){
                    //         x = snapshot.store[item].x;
                    //         y = snapshot.store[item].y;
                    //         const w = snapshot.store[item].props.w;
                    //         const h = snapshot.store[item].props.h;
                                
                    //         let ratio_w = 600 / w;
                    //         let ratio_h = 1000 / h; 
                    //         let ratio = Math.min(ratio_w, ratio_h);
                    //         ratio = ratio.toFixed(2);

                    //         editor?.setCamera({ x: -x+1500, y: -y+500, z: 1*ratio}, { duration: 500, easing: (t) => t * t });
                    //         editor?.select(curClickedNodeKey);
                    //         break;
                    //     }
                    // }
                    editor?.select(curClickedNodeKey);
                    editor.zoomToSelection({ animation: { duration: 500 } });
                }else if (curClickedNodeKey.includes('_')) {
                    // citation node
                    console.log(`[${current()}]`+ "[Space2Think] curClickedNodeKey is document", curClickedNodeKey)
                    await logger.logUserAction("[Space2Think] curClickedNodeKey is document", {details: curClickedNodeKey});
                    for (var item in snapshot.store){
                        if(snapshot.store[item].type === "xx_html" && snapshot.store[item].props.label === curClickedNodeKey){
                            // console.log(`[${current()}]`+ "[Space to Think] item", snapshot.store[item])
                        
                            // camera move to the document
                            const parentId = snapshot.store[item].parentId;
                            
                            const x1 = snapshot.store[item].x;
                            const y1 = snapshot.store[item].y;

                            // x = snapshot.store[parentId].x;
                            // y = snapshot.store[parentId].y;
                            
                            if (snapshot.store[parentId].parentId !== null && snapshot.store[parentId].parentId !== undefined){
                                x = snapshot.store[parentId].x + x1;
                                y = snapshot.store[parentId].y + y1;
                            }
                            else{
                                x = x1;
                                y = y1;
                            }
                            console.log(`[${current()}]`+ "[Space to Think] x", x, "y", y)
                            // if (drawerOpen) {
                            //     editor?.setCamera({ x: -x+200, y: -y+300, z: 1 }, { duration: 500, easing: (t) => t * t });
                            // }
                            // else {
                            //     editor?.setCamera({ x: -x+400, y: -y+300, z: 1 }, { duration: 500, easing: (t) => t * t });
                            // }
                            
                            editor?.select(snapshot.store[item].id);
                            editor.zoomToSelection({ animation: { duration: 500 } });
                            break;
                        }
                    }
                }
                else if (curClickedNodeKey=="blank"){
                    await logger.logUserAction("[Space2Think] curClickedNodeKey is blank", {details: curClickedNodeKey});
                    for (var item in snapshot.store){
                        if (snapshot.store[item].type === "xx_html")
                        {
                            editor?.updateShape({
                                id: snapshot.store[item].id,
                                type: 'xx_html',
                                props: {
                                    ...snapshot.store[item].props,
                                    selectedhl: [],
                                }
                            })
                        }
                    }
                    // console.log("[Space2Think] after blank click: snapshot", snapshot.store)
                    editor?.selectNone();
                    // remove all classes
                }
                else{
                    // normal node
                    // entity is selected
                    // console.log(`[${current()}]`+ "[Space2Think] curClickedNodeKey is entity", curClickedNodeKey)
                    // console.log(`[${current()}]`+ "[Space2Think] allKeywords", keywords)
                    let doc = null;
                    let label = null;
                    for (var item in keywords){
                        if(keywords[item].hasOwnProperty(curClickedNodeKey)){
                            // console.log(`[${current()}]`+ "[Space to Think] keyword: type and keyword: ", item, "curClickedNodeKey", curClickedNodeKey);
                            // console.log(`[${current()}]`+ "[Space to Think] the doc includes this keyword: ", keywords[item][curClickedNodeKey])
                            doc = keywords[item][curClickedNodeKey];
                            label = item;
                            break;
                        }
                    }
                    await logger.logUserAction("[Space2Think] curClickedNodeKey is keyword", {details: curClickedNodeKey});
                    
                    let shapes = {};
                    let weirdId = null;
                    console.log(`[${current()}]`+ "[Space2Think] the doc entity is in:", doc)
                    if (doc){
                        for (var item in snapshot.store){
                            if(snapshot.store[item].type === "xx_html" ){
                                
                                if (doc.includes(snapshot.store[item].props.label)){
        
                                    // console.log(`[${current()}]`+ "[Space2Think] the doc label", snapshot.store[item].props.label)
                                    // console.log(`[${current()}]`+ "[Space2Think] the doc's space item", snapshot.store[item])
                                    const selectedhl = [curClickedNodeKey];
        
                                    editor?.updateShape({
                                        id: snapshot.store[item].id,
                                        type: 'xx_html',
                                        parentId: snapshot.store[item].parentId,
                                        x: snapshot.store[item].x,
                                        y: snapshot.store[item].y,
                                        props: {
                                            ...snapshot.store[item].props,
                                            selectedhl: selectedhl,
                                        }
                                    })
                                    // console.log(`[${current()}]`+ "[Space2Think] the doc's updated space item", snapshot.store[item])
                                    shapes[snapshot.store[item].id] = {};
                                    shapes[snapshot.store[item].id].x = snapshot.store[item].x;
                                    shapes[snapshot.store[item].id].y = snapshot.store[item].y;
                                    shapes[snapshot.store[item].id].w = snapshot.store[item].props.w;
                                    shapes[snapshot.store[item].id].h = snapshot.store[item].props.h;
                                    let parentId = snapshot.store[item].parentId;
                                    // console.log(`[${current()}]`+ "[Space to Think] parentId", parentId)
                                    if (parentId !== "page:page"){
                                        shapes[snapshot.store[item].id].parent = parentId;
                                        shapes[snapshot.store[item].id].parentX = snapshot.store[parentId].x;
                                        shapes[snapshot.store[item].id].parentY = snapshot.store[parentId].y;
                                        shapes[snapshot.store[item].id].parentW = snapshot.store[parentId].props.w;
                                        shapes[snapshot.store[item].id].parentH = snapshot.store[parentId].props.h;
                                    }else{
                                        shapes[snapshot.store[item].id].parent = parentId;
                                        shapes[snapshot.store[item].id].parentX = 0;
                                        shapes[snapshot.store[item].id].parentY = 0;
                                        shapes[snapshot.store[item].id].parentW = 0;
                                        shapes[snapshot.store[item].id].parentH = 0;
                                    }
                                    weirdId = item;                          
                                }
                                else {
                                    editor?.updateShapes([{
                                        id: snapshot.store[item].id,
                                        type: 'xx_html',
                                        props: {
                                            ...snapshot.store[item].props,
                                            selectedhl: [],
                                        }
                                    }])
                                
                                }
                            }
                        }
                        // console.log(`[${current()}]`+ "[Space to Think] updated shapes after2 ", snapshot.store[weirdId])
                        
        
                        if(Object.keys(shapes).length==1){
                            console.log(`[${current()}]`+ "[Space2think] one keyword in one document")
                            const id = Object.keys(shapes)[0];
                            let x = shapes[id].x;
                            let y = shapes[id].y;
                            let x1 = shapes[id].parentX;
                            let y1 = shapes[id].parentY;
                            // camera move to the keywords
                            // editor?.setCamera({ x: -x-x1+200, y: -y-y1+300, z: 0.8 }, { duration: 500, easing: (t) => t * t });
                            editor?.select(id);
                            editor.zoomToSelection({ animation: { duration: 500 } });
                        }
                        else if (Object.keys(shapes).length>1){
                            console.log(`[${current()}]`+ "[Space2think] one keyword in different documents")
                            let parent = {}
        
                            for (var item in shapes){
                                if(!parent.hasOwnProperty(shapes[item].parent)){
                                    parent[shapes[item].parent] = [shapes[item].parentX, shapes[item].parentY, shapes[item].parentW, shapes[item].parentH]
                                }
                            }
                            console.log(`[${current()}]`+ "[Space2think] the keyword's parents", parent)
        
                            // same parent
                            if (Object.keys(parent).length == 1 && Object.keys(parent)[0] === "page:page"){
                                // different parents
                                console.log(`[${current()}]`+ "[Space2think] one keyword without clusters")
                                let minX = 100000;
                                let maxX = -100000;
                                let minY = 100000;
                                let maxY = -100000;
                                for (var item in shapes){
                                    if (shapes[item].x < minX){
                                        minX = shapes[item].x;
                                    }
                                    if (shapes[item].y < minY){
                                        minY = shapes[item].y;
                                    }
                                    if (shapes[item].x + shapes[item].w > maxX){
                                        maxX = shapes[item].x + shapes[item].w;
                                    }
                                    if (shapes[item].y + shapes[item].h > maxY){
                                        maxY = shapes[item].y + shapes[item].h;
                                    }
                                }
                                const distX = maxX - minX;
                                const distY = maxY - minY;
                                const dist = Math.max(distX, distY);
                                let ratio = 800 / dist;
                                ratio = ratio.toFixed(2);
                                // console.log(`[${current()}]`+ "[Space2think] shapes", shapes)
                                // console.log(`[${current()}]`+ "[Space2think] one keyword without clusters: min and max", "minX", minX, "maxX", maxX, "minY", minY, "maxY", maxY, "dist", dist, "ratio", ratio)    
                                // editor?.setCamera({ x: -minX+100, y: -minY+100, z: 1*ratio }, { duration: 500, easing: (t) => t * t });
                                editor?.select(...Object.keys(shapes));
                                editor.zoomToSelection({ animation: { duration: 500 } });
                            }
                            else if (Object.keys(parent).length == 1){
                                console.log(`[${current()}]`+ "[Space2think] one keyword in one cluster")
                                let x = 0;
                                let y = 0;
                                let ratio = 1;
                                for (var item in parent){
                                    x = parent[item][0];
                                    y = parent[item][1];
        
                                    // console.log(`[${current()}]`+ "[Space to Think] only one parent: parent position", "x", x, "y", y)
                                    
                                    // console.log(`[${current()}]`+ "[Space to Think] only one parent: parent width", parent[item][2])
                                    
                                    ratio = 600 / parent[item][2];
                                    ratio = ratio.toFixed(2);
        
                                    // editor?.setCamera({ x: -x+200, y: -y+200, z: 1*ratio}, { duration: 500, easing: (t) => t * t });
                                    editor?.select(...Object.keys(shapes));
                                    editor.zoomToSelection({ animation: { duration: 500 } });
                                }
                            }
                            else if (Object.keys(parent).length > 1){
                                // different parents
                                console.log(`[${current()}]`+ "[Space2think] one keyword in different clusters")
                                let minX = 100000;
                                let maxX = 0;
                                let minY = 100000;
                                let maxY = 0;
                                for (var item in parent){
                                    if (parent[item][0] < minX){
                                        minX = parent[item][0];
                                    }
                                    if (parent[item][1] < minY){
                                        minY = parent[item][1];
                                    }
                                    if (parent[item][0] + parent[item][2] > maxX){
                                        maxX = parent[item][0] + parent[item][2];
                                    }
                                    if (parent[item][1] + parent[item][3] > maxY){
                                        maxY = parent[item][1] + parent[item][3];
                                    }
                                }
                                const distX = maxX - minX;
                                const distY = maxY - minY;
                                const dist = Math.max(distX, distY);
                                let ratio = 600 / dist;
                                ratio = ratio.toFixed(2);
                                console.log("[Space to Think] different parents: min and max", "minX", minX, "maxX", maxX, "minY", minY, "maxY", maxY, "ratio", ratio)
                                // editor?.setCamera({ x: -minX, y: -minY, z: 1.5*ratio }, { duration: 500, easing: (t) => t * t });
                                editor?.select(...Object.keys(shapes));
                                editor.zoomToSelection({ animation: { duration: 500 } });
                            }
                        }
                    }
                    
        
                }
            }
            
            // Handle window resize
            const handleResize = () => {
                setWindowHeight(window.innerHeight);
            };

            const handleSelectionChange = () => {
                const selection = window.getSelection();
                setSelectedText(selection.toString());
            };
        
            window.addEventListener('resize', handleResize);
            document.addEventListener('selectionchange', handleSelectionChange);

            return () => {
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('selectionchange', handleSelectionChange);
            };
        };
    handleReportClick();
    }, [curClickedNodeKey]);

    

    useEffect(() => {
        const handleSelectionChange = async () => {
            const currentSelected = editor?.getSelectedShapeIds();
            console.log(`[${current()}]`+ "[Space2think] currentSelected shapeid:", currentSelected)
            if (currentSelected !== null && currentSelected !== undefined && Object.keys(snapshot.store).length > 2 && currentSelected.length ===1){
                if (snapshot.store[currentSelected[0]]!==undefined){
                    if (snapshot.store[currentSelected[0]].type==="xx_html"){
                        const label = snapshot.store[currentSelected[0]].props.label;
                        dispatch(setSelectedId(label));
                        console.log(`[${current()}]`+ "[Space2think] document is selected", label)
                        await logger.logUserAction("[Space2think] document is selected in space", {details: label});
                        // console.log(`[${current()}]`+ "[Space2think] dispatch selected document label", label)
                    }
                    else if (snapshot.store[currentSelected[0]].type==="frame"){
                        const id = currentSelected[0];
                        dispatch(setSelectedId(id));
                        console.log(`[${current()}]`+ "[Space2think] frame (id) is selected", id)
                        await logger.logUserAction("[Space2think] frame (id) is selected in space", {details: id});
                        // console.log(`[${current()}]`+ "[Space2think] dispatch selected frame id", id)
                    }
                }
                else{
                    console.log(`[${current()}]`+ "[Space2think] clicked one deleted shape in report")
                }
            }
            else if (currentSelected && currentSelected.length===0){
                // console.log(`[${current()}]`+ "[Space2think] dispatch selected blank")
                console.log(`[${current()}]`+ "[Space2think] selected blank")
                dispatch(setSelectedId(null));
            }
            // if (snapshot){console.log(`[${current()}]`+ "[Space2think] snapshot getselectedshapeIds", JSON.stringify(snapshot))}
        }
        handleSelectionChange();
    },[editor?.getSelectedShapeIds()])

    // Track object movement, frame creation/renaming, and note editing
    // useEffect(() => {
    //     if (!editor) return;
        
    //     // Store previous positions to detect movement
    //     const previousPositions = new Map();
    //     const previousFrameNames = new Map();
    //     const previousNoteTexts = new Map();
        
    //     // Track ongoing interactions to avoid duplicate logging
    //     const ongoingMovements = new Set();
    //     const ongoingFrameRenames = new Set();
    //     const ongoingNoteEdits = new Set();
    //     const ongoingFrameResizes = new Set();
        
    //     // Track all previous shape IDs for deletion detection
    //     let previousAllShapeIds = new Set();
        
    //     // Track the previous snapshot for deletion detection
    //     let previousSnapshot = null;
        
    //     const unsubscribe = editor.store.listen(() => {
    //         const snapshot = editor.store.getSnapshot();
            
    //         // Check for shapes that are about to be deleted (before they're actually removed)
    //         if (previousSnapshot) {
    //             const currentShapeIds = new Set(Object.keys(snapshot.store));
    //             const previousShapeIds = new Set(Object.keys(previousSnapshot.store));
                
    //             // Find shapes that exist in previous but not in current (about to be deleted)
    //             // Only perform frame recovery if we're not loading a new dataset
    //             // console.log(`[${current()}]`+ "[Space2think] isLoadingDataset", isLoadingDataset)
    //             // if (!isLoadingDataset) {
    //                 previousShapeIds.forEach(shapeId => {
    //                     if (!currentShapeIds.has(shapeId)) {
    //                         const deletedShape = previousSnapshot.store[shapeId];
    //                         if (deletedShape && deletedShape.type === 'frame') {
    //                             // Find all shapes that had this frame as parent from the previous snapshot
    //                             const orphanedShapes = Object.values(previousSnapshot.store).filter(
    //                                 shape => shape.parentId === shapeId
    //                             );
                                
    //                             // If frame had children, we'll need to recreate them after deletion
    //                             if (orphanedShapes.length > 0) {
    //                                 console.log(`[${current()}] Frame ${shapeId} about to be deleted with ${orphanedShapes.length} children - will recreate them`);
    //                                 logger.logUserAction("[Space2Think] Frame about to be deleted with children - will recreate them", {
    //                                     frameId: shapeId,
    //                                     frameName: deletedShape.props.name,
    //                                     childCount: orphanedShapes.length,
    //                                     children: orphanedShapes.map(s => ({ id: s.id, type: s.type }))
    //                                 });
                                    
    //                                 // Store the orphaned shapes info for recreation after deletion
    //                                 setTimeout(() => {
    //                                     // Recreate the orphaned shapes at root level with absolute positioning
    //                                     orphanedShapes.forEach(childShape => {
    //                                         let absoluteX, absoluteY;
                                            
    //                                         if (childShape.type === 'frame') {
    //                                             // This is a subcluster - need to handle nested positioning
    //                                             if (deletedShape.parentId === 'page:page') {
    //                                                 // Deleted frame was a main cluster, so subcluster goes to root
    //                                                 absoluteX = deletedShape.x + childShape.x;
    //                                                 absoluteY = deletedShape.y + childShape.y;
    //                                             } else {
    //                                                 // Deleted frame was a subcluster, need to find its parent cluster
    //                                                 const parentCluster = previousSnapshot.store[deletedShape.parentId];
    //                                                 if (parentCluster && parentCluster.type === 'frame') {
    //                                                     // Calculate position relative to the parent cluster
    //                                                     absoluteX = parentCluster.x + deletedShape.x + childShape.x;
    //                                                     absoluteY = parentCluster.y + deletedShape.y + childShape.y;
    //                                                 } else {
    //                                                     // Fallback to direct calculation
    //                                                     absoluteX = deletedShape.x + childShape.x;
    //                                                     absoluteY = deletedShape.y + childShape.y;
    //                                                 }
    //                                             }
    //                                         } else {
    //                                             // This is a regular shape (xx_html, note, etc.)
    //                                             if (deletedShape.parentId === 'page:page') {
    //                                                 // Deleted frame was a main cluster
    //                                                 absoluteX = deletedShape.x + childShape.x;
    //                                                 absoluteY = deletedShape.y + childShape.y;
    //                                             } else {
    //                                                 // Deleted frame was a subcluster, need to find its parent cluster
    //                                                 const parentCluster = previousSnapshot.store[deletedShape.parentId];
    //                                                 if (parentCluster && parentCluster.type === 'frame') {
    //                                                     // Calculate position relative to the parent cluster
    //                                                     absoluteX = parentCluster.x + deletedShape.x + childShape.x;
    //                                                     absoluteY = parentCluster.y + deletedShape.y + childShape.y;
    //                                                 } else {
    //                                                     // Fallback to direct calculation
    //                                                     absoluteX = deletedShape.x + childShape.x;
    //                                                     absoluteY = deletedShape.y + childShape.y;
    //                                                 }
    //                                             }
    //                                         }
                                            
    //                                         // Create a new shape at root level
    //                                         editor.createShapes([{
    //                                             id: childShape.id,
    //                                             type: childShape.type,
    //                                             parentId: 'page:page',
    //                                             x: absoluteX,
    //                                             y: absoluteY,
    //                                             props: childShape.props
    //                                         }]);
    //                                     });
    //                                 }, 0); // Use setTimeout to ensure deletion completes first
    //                             }
    //                         }
    //                     }
    //                 });
    //             // }
    //         }
            
    //         // Track specific shape movements with detailed logging
    //         Object.keys(snapshot.store).forEach(shapeId => {
    //             const shape = snapshot.store[shapeId];
    //             const prevPos = previousPositions.get(shapeId);
                
    //             if (shape.type === 'xx_html') {
    //                 // Track HTML document movements
    //                 if (prevPos && (prevPos.x !== shape.x || prevPos.y !== shape.y)) {
    //                     if (!ongoingMovements.has(shapeId)) {
    //                         ongoingMovements.add(shapeId);
    //                         logger.logUserAction("[Space2Think] HTML Document moved", {
    //                             shapeId: shapeId,
    //                             label: shape.props.label,
    //                             from: { x: prevPos.x, y: prevPos.y },
    //                             to: { x: shape.x, y: shape.y },
    //                             delta: { x: shape.x - prevPos.x, y: shape.y - prevPos.y }
    //                         });
    //                     }
    //                 } else if (ongoingMovements.has(shapeId)) {
    //                     // Remove from ongoing movements when stopped
    //                     ongoingMovements.delete(shapeId);
    //                 }
    //                 previousPositions.set(shapeId, { x: shape.x, y: shape.y });
    //             }
    //             else if (shape.type === 'frame') {
    //                 // Track frame movements, resizing, and name changes
    //                 const prevName = previousFrameNames.get(shapeId);
    //                 const prevPos = previousPositions.get(shapeId);
    //                 const prevSize = previousPositions.get(shapeId + '_size');
    //                 const currentSize = { w: shape.props.w, h: shape.props.h };
                    
    //                 // Check for size changes (resizing) - prioritize this over movement
    //                 const hasSizeChanged = prevSize && (prevSize.w !== currentSize.w || prevSize.h !== currentSize.h);
    //                 const hasPositionChanged = prevPos && (prevPos.x !== shape.x || prevPos.y !== shape.y);
                    
    //                 if (hasSizeChanged) {
    //                     if (!ongoingFrameResizes.has(shapeId)) {
    //                         ongoingFrameResizes.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Frame resized", {
    //                             frameId: shapeId,
    //                             frameName: shape.props.name,
    //                             from: { width: prevSize.w, height: prevSize.h },
    //                             to: { width: currentSize.w, height: currentSize.h },
    //                             delta: { width: currentSize.w - prevSize.w, height: currentSize.h - prevSize.h }
    //                         });
    //                     }
    //                 } else if (ongoingFrameResizes.has(shapeId)) {
    //                     ongoingFrameResizes.delete(shapeId);
    //                 }
                    
    //                 // Check for position changes (movement) - only if no size change
    //                 if (hasPositionChanged && !hasSizeChanged) {
    //                     if (!ongoingMovements.has(shapeId)) {
    //                         ongoingMovements.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Frame moved", {
    //                             frameId: shapeId,
    //                             frameName: shape.props.name,
    //                             from: { x: prevPos.x, y: prevPos.y },
    //                             to: { x: shape.x, y: shape.y },
    //                             delta: { x: shape.x - prevPos.x, y: shape.y - prevPos.y }
    //                         });
    //                     }
    //                 } else if (ongoingMovements.has(shapeId)) {
    //                     ongoingMovements.delete(shapeId);
    //                 }
                    
    //                 if (prevName && prevName !== shape.props.name) {
    //                     if (!ongoingFrameRenames.has(shapeId)) {
    //                         ongoingFrameRenames.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Frame renamed", {
    //                             frameId: shapeId,
    //                             from: prevName,
    //                             to: shape.props.name
    //                         });
    //                     }
    //                 } else if (ongoingFrameRenames.has(shapeId)) {
    //                     ongoingFrameRenames.delete(shapeId);
    //                 }
                    
    //                 previousFrameNames.set(shapeId, shape.props.name);
    //                 previousPositions.set(shapeId, { x: shape.x, y: shape.y });
    //                 previousPositions.set(shapeId + '_size', { w: shape.props.w, h: shape.props.h });
    //             }
    //             else if (shape.type === 'note') {
    //                 // Track note movements and text changes
    //                 const prevText = previousNoteTexts.get(shapeId);
    //                 const prevPos = previousPositions.get(shapeId);
                    
    //                 if (prevPos && (prevPos.x !== shape.x || prevPos.y !== shape.y)) {
    //                     if (!ongoingMovements.has(shapeId)) {
    //                         ongoingMovements.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Note moved", {
    //                             noteId: shapeId,
    //                             from: { x: prevPos.x, y: prevPos.y },
    //                             to: { x: shape.x, y: shape.y },
    //                             delta: { x: shape.x - prevPos.x, y: shape.y - prevPos.y }
    //                         });
    //                     }
    //                 } else if (ongoingMovements.has(shapeId)) {
    //                     ongoingMovements.delete(shapeId);
    //                 }
                    
    //                 if (prevText && prevText !== shape.props.text) {
    //                     if (!ongoingNoteEdits.has(shapeId)) {
    //                         ongoingNoteEdits.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Note text changed", {
    //                             noteId: shapeId,
    //                             from: prevText,
    //                             to: shape.props.text
    //                         });
    //                     }
    //                 } else if (ongoingNoteEdits.has(shapeId)) {
    //                     ongoingNoteEdits.delete(shapeId);
    //                 }
                    
    //                 previousNoteTexts.set(shapeId, shape.props.text);
    //                 previousPositions.set(shapeId, { x: shape.x, y: shape.y });
    //             }
    //             else if (shape.type === 'text') {
    //                 // Track text shape movements and content changes
    //                 const prevPos = previousPositions.get(shapeId);
                    
    //                 if (prevPos && (prevPos.x !== shape.x || prevPos.y !== shape.y)) {
    //                     if (!ongoingMovements.has(shapeId)) {
    //                         ongoingMovements.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Text shape moved", {
    //                             textId: shapeId,
    //                             text: shape.props.text?.substring(0, 50) + "...",
    //                             from: { x: prevPos.x, y: prevPos.y },
    //                             to: { x: shape.x, y: shape.y },
    //                             delta: { x: shape.x - prevPos.x, y: shape.y - prevPos.y }
    //                         });
    //                     }
    //                 } else if (ongoingMovements.has(shapeId)) {
    //                     ongoingMovements.delete(shapeId);
    //                 }
                    
    //                 previousPositions.set(shapeId, { x: shape.x, y: shape.y });
    //             }
    //             else {
    //                 // Track other shape types
    //                 const prevPos = previousPositions.get(shapeId);
                    
    //                 if (prevPos && (prevPos.x !== shape.x || prevPos.y !== shape.y)) {
    //                     if (!ongoingMovements.has(shapeId)) {
    //                         ongoingMovements.add(shapeId);
    //                         logger.logUserAction("[Space2Think] Other shape moved", {
    //                             shapeId: shapeId,
    //                             shapeType: shape.type,
    //                             from: { x: prevPos.x, y: prevPos.y },
    //                             to: { x: shape.x, y: shape.y },
    //                             delta: { x: shape.x - prevPos.x, y: shape.y - prevPos.y }
    //                         });
    //                     }
    //                 } else if (ongoingMovements.has(shapeId)) {
    //                     ongoingMovements.delete(shapeId);
    //                 }
                    
    //                 previousPositions.set(shapeId, { x: shape.x, y: shape.y });
    //             }
    //         });
            
    //         // Track shape creation and deletion
    //         const currentShapeIds = new Set(Object.keys(snapshot.store));
            
    //         // // New shapes
    //         // currentShapeIds.forEach(shapeId => {
    //         //     if (!previousAllShapeIds.has(shapeId)) {
    //         //         const shape = snapshot.store[shapeId];
    //         //         logger.logUserAction("[Space2Think] New shape created", {
    //         //             shapeId: shapeId,
    //         //             shapeType: shape.type,
    //         //             position: { x: shape.x, y: shape.y }
    //         //         });
    //         //     }
    //         // });
            
    //                     // Deleted shapes (logging only, auto-ungrouping handled earlier)
    //         previousAllShapeIds.forEach(shapeId => {
    //             if (!currentShapeIds.has(shapeId)) {
    //                 // Log the deletion for tracking purposes
    //                 // logger.logUserAction("[Space2Think] Shape deleted", {
    //                 //     shapeId: shapeId,
    //                 //     type: previousSnapshot.store[shapeId].type,
    //                 // });
                    
    //                 // Clean up tracking maps
    //                 previousPositions.delete(shapeId);
    //                 previousFrameNames.delete(shapeId);
    //                 previousNoteTexts.delete(shapeId);
    //                 ongoingMovements.delete(shapeId);
    //                 ongoingFrameRenames.delete(shapeId);
    //                 ongoingNoteEdits.delete(shapeId);
    //                 ongoingFrameResizes.delete(shapeId);
    //                 // Also clean up size tracking
    //                 previousPositions.delete(shapeId + '_size');
    //             }
    //         });
            
    //         // Update the previous shape IDs and snapshot for next iteration
    //         previousAllShapeIds = new Set(currentShapeIds);
    //         previousSnapshot = { ...snapshot };
    //     });
        
    //     return unsubscribe;
    // }, [editor]);

    const handleGenerateReport = async () => {
        const apiKeyInput = document.getElementById('openai_key_risky_but_cool');
        const apiKey = localStorage.getItem('openai_key_risky_but_cool');
        if ((!apiKeyInput || !apiKeyInput.value) && (!apiKey || apiKey.trim() === '')) {
            // API key should have been set on page load, but if not, just return silently
            return;
        }
        setLoading(true);
        setReportFinish(false);
        setReportApiError('');
        dispatch(setRefineReactMessage({}));
        let generatedReport = "";
        try {
            let snapshot = editor?.store.getSnapshot();
            let ifhaveFrame = false;
            for (var item in snapshot.store){
                if (snapshot.store[item].type === "frame"){
                    ifhaveFrame = true;
                    break;
                }
            }
            dispatch(setCurrentSnapshot(snapshot));
            dispatch(setReportRefineSettings(reportRefineSettings));
            if (ifhaveFrame){
                // setLoading(true);
                console.log(`[${current()}]`+ "[Space2Think] Enter into the refined report generation");
                console.log(`[${current()}]`+ "[Space2Think] snapshot for generation", snapshot);
                console.log(`[${current()}]`+ "[Space2Think] preReport", preReport);
                let showModification = false;
                if (!preReport || preReport === "" || preReport === null || preReport === undefined){
                    await logger.logUserAction("[Space2Think] first generation from structured space, snapshot in details", {details: editor?.store.getSnapshot()});
                    await logger.logUserAction("[Space2Think] report generation snapshot", {details: JSON.stringify(editor?.store.getSnapshot())});
                    console.log(`[${current()}]`+ "[Space2Think] preReport is empty");
                    generatedReport = await reportGeneration(
                        editor?.store.getSnapshot(),
                        taskDescription,
                        reportStructure,
                        modelSettings.reportGenerationModel,
                        Number(modelSettings.max_tokens),
                        Number(modelSettings.temperature)
                    );
                    dispatch(setPreSnapshot(editor?.store.getSnapshot()));
                    await logger.logUserAction("[Space2Think] first generation from structured space, report in details", {details: generatedReport});
                }
                else{
                    console.log(`[${current()}]`+ "[Space2Think] preReport is not empty");
                    await logger.logUserAction("[Space2Think] refinement from structured space, snapshot in details", {details: editor?.store.getSnapshot()});
                    await logger.logUserAction("[Space2Think] report refinement snapshot", {details: JSON.stringify(editor?.store.getSnapshot())});
                    showModification = true;
                    generatedReport = await reportRefinement(
                        editor?.store.getSnapshot(),
                        preReport,
                        preSnapshot,
                        reportStructure,
                        dispatch,
                        reportRefineSettings,
                        taskDescription,
                        previousTaskDescription,
                        previousReportStructure,
                        previousReportRefineSettings,
                    );
                    dispatch(setPreSnapshot(editor?.store.getSnapshot()));
                    await logger.logUserAction("[Space2Think] refinement from structured space, report in details", {details: generatedReport});
                }
                // generatedReport = await reportRefinement(editor?.store.getSnapshot(), preReport, preSnapshot);
                if (generatedReport){
                    await reportToClusterName(editor, generatedReport);
                    await keywordsToST(editor, generatedReport, dispatch);
                    const UserKy = extractUserKeywords(editor?.store.getSnapshot());
                    dispatch(setUserKeywords(UserKy));
                    dispatch(addToReportHistory(generatedReport));
                    dispatch(setReport(generatedReport));
                    dispatch(setPreReport(generatedReport));
                    if (showModification){
                        dispatch(setModifiedGeneration(true));
                        // will rewrite the report part that is modified
                        const diffDict = showModifications(preReport, generatedReport);
                        dispatch(setModifiedJson(diffDict));
                        dispatch(setModifiedState(true));
                        console.log(`[${current()}]`+ "[Space2Think] diffDict", diffDict);
                    }
                }
                
                
                dispatch(setPreviousTaskDescription(taskDescription));
                dispatch(setPreviousReportStructure(reportStructure));
                dispatch(setDrawerOpen());
                dispatch(setReportOpen());
                dispatch(setPreviousReportRefineSettings(reportRefineSettings));
                setLoading(false);
                setReportFinish(true);
            } else{
                console.log(`[${current()}]`+ "[Space2Think] Initial report generation requires at least one frame");
                setLoading(false);
                setFrameErrorOpen(true);
            }            
            console.log(`[${current()}]`+ "[Space2Think] reportHistory length", reportHistory.length)
            console.log(`[${current()}]`+ "[Space2Think] generated report:", generatedReport);
        } catch (error) {
            console.error(`[${current()}]`+ "[Space2Think] Error generating report:", error);
            setLoading(false);

            // Check if the error is related to the API key
            if (error.message?.includes('API key') || 
                error.message?.includes('Invalid authentication') ||
                error.message?.includes('Incorrect API key') ||
                error.message?.includes('auth')) {
                setApiKeyError(error.message);
                setApiKeyDialogOpen(true);
                setReportApiError('');
                // Remove the invalid API key
                const apiKeyInput = document.getElementById('openai_key_risky_but_cool');
                if (apiKeyInput) {
                    apiKeyInput.value = '';
                }
            } else {
                setReportApiError(error.message || 'Sorry, there was an error fetching from OpenAI. Please check your API key and try again.');
            }
        }
    };

    useEffect(() => {
        let selectedWord = "";

        const llmHighlights = document.querySelectorAll('llmhighlight');

        llmHighlights.forEach(element => {
            element.addEventListener('mousedown', function(event) {
                if(element.textContent!==''){
                    selectedWord = element.textContent;
                    
                    // Determine which container the click occurred in
                    let container = element;
                    while (container && !container.classList.contains('editor_space') && 
                           !container.classList.contains('chatbot-container') && 
                           !container.classList.contains('editor-input')) {
                        container = container.parentElement;
                    }

                    if (container) {
                        if (container.classList.contains('editor_space')) {
                            // console.log('[Space2Think] Click in editor space');
                            setSelectedContainerClass('editor_space');
                            dispatch(setSelectedEntity(selectedWord));
                        } else if (container.classList.contains('chatbot-container')) {
                            // console.log('[Space2Think] Click in chatbot container');
                            setSelectedContainerClass('chatbot-container');
                            dispatch(setSelectedEntity(selectedWord));
                        } else if (container.classList.contains('editor-input')) {
                            // console.log('[Space2Think] Click in editor input');
                            setSelectedContainerClass('editor-input');
                            dispatch(setSelectedEntity(selectedWord));
                        }
                    }
                    
                    event.stopPropagation();
                }
            });
        });

        const commonhls = document.querySelectorAll('commonhl');

        commonhls.forEach(element => {
            element.addEventListener('mousedown', function(event) {
                if(element.textContent!==''){
                    selectedWord = element.textContent;
                    // console.log(`[${current()}]`+ "[Space2Think] selectedWord", selectedWord);
                    dispatch(setSelectedEntity(selectedWord));
                    event.stopPropagation();
                    // dispatch(setCurClickedNodeKey(selectedWord));
                }
            });
        });
                                        
        },[snapshot]);

    // }, 

    useEffect(() => {
        const handleHighlight = async () => {
        // dispatch(setCurClickedNodeKey(selectedEntity))
        // console.log(`[${current()}]`+ "[Space2Think] selectedContainerClass", selectedContainerClass)
        // if (selectedContainerClass === 'chatbot-container'){
        //     dispatch(setCurClickedNodeKey(selectedEntity))
        // }

            if (selectedEntity !== null && selectedEntity !== undefined && selectedEntity !== ""){
                console.log(`[${current()}]`+ "[Space2Think] selectedEntity", selectedEntity);
                await logger.logUserAction("[Space2Think] selectedEntity", {details: selectedEntity});
                const selectedhl = [selectedEntity];
                if (snapshot !== null && snapshot !== undefined){
                    // Perform the highlight updates while maintaining positions
                    for (var item in snapshot.store){
                        if(snapshot.store[item].type === "xx_html" ){
                            const commonhl = snapshot.store[item].props.commonhl;
                            const llmhighlight = snapshot.store[item].props.llmhighlight;
                            const currentX = snapshot.store[item].x;
                            const currentY = snapshot.store[item].y;
                            const parentId = snapshot.store[item].parentId;
                            
                            if (commonhl.includes(selectedEntity)||llmhighlight.includes(selectedEntity)){
                                editor?.updateShape({
                                    id: snapshot.store[item].id,
                                    type: 'xx_html',
                                    x: currentX,
                                    y: currentY,
                                    parentId: parentId,
                                    props: {
                                        ...snapshot.store[item].props,
                                        selectedhl: selectedhl,
                                    }
                                });
                            }
                            else{
                                editor?.updateShape({
                                    id: snapshot.store[item].id,
                                    type: 'xx_html',
                                    x: currentX,
                                    y: currentY,
                                    parentId: parentId,
                                    props: {
                                        ...snapshot.store[item].props,
                                        selectedhl: [],
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        handleHighlight();
    }, [selectedEntity]);

    useEffect(() => {
        if (selectedContainerClass === 'chatbot-container'){
            dispatch(setCurClickedNodeKey(selectedCite))
        }
    }, [selectedCite]);
 
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
        if (newValue === 2) { // Report tab is now index 2
            dispatch(setReportOpen());
        } else {
            dispatch(setReportClose());
        }
    };

    useEffect(() => {
        if (reportFinish) {
            setCurrentTab(2);
            dispatch(setReportOpen());
        }
    }, [reportFinish, dispatch]);

    useEffect(() => {
        if (report && report !== '' && !reportOpen) {
            setCurrentTab(2);
            dispatch(setReportOpen());
        }
    }, [report, dispatch]);

    // Model settings state
    const [modelSettings, setModelSettings] = useState({
      reportGenerationModel: 'gpt-4o-mini',
      reportGenerationBlankModel: 'gpt-4o-mini',
      reportRefinementModel: 'gpt-4o-mini',
      reportRefinementReasoningModel: 'gpt-4o-mini',
      max_tokens: 10000,
      temperature: 0,
      refinementReasoningMaxTokens: 1000,
      refinementRefineMaxTokens: 10000,
      refinementReasoningTemperature: 0,
      refinementRefineTemperature: 0,
    });

    // Tutorial state
    const [tutorialVisible, setTutorialVisible] = useState(false);

    // Navigation prevention effects
    useEffect(() => {
        // Prevent browser navigation on touchpad gestures
        const handlePopState = (event) => {
            event.preventDefault();
            // Restore the current state
            window.history.pushState(null, '', window.location.href);
        };

        // Handle beforeunload to warn about unsaved changes
        const handleBeforeUnload = (event) => {
            // Check for unsaved changes
            const hasUnsavedChanges = (() => {
                // Check if there's content in the editor
                if (editor) {
                    const snapshot = editor.store.getSnapshot();
                    if (snapshot && Object.keys(snapshot.store).length > 2) {
                        return true;
                    }
                }
                
                // Check if there's a report that hasn't been saved
                if (report && report !== '') {
                    return true;
                }
                
                // Check if there are modifications that haven't been saved
                if (modifiedGeneration) {
                    return true;
                }
                
                return false;
            })();
            
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        // Add event listeners
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Push initial state to prevent navigation issues
        window.history.pushState(null, '', window.location.href);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [editor, report, modifiedGeneration]);



    return (
        <Box>
            <div id="header-main-container">
            <AppBar position="fixed" open={drawerOpen} drawerWidth={drawerWidth}>            
                <div className='toolbar-wrapper'>
                    <div className='toolbar'>
                        <Tooltip title='Files' placement='top'>
                        <Button
                            className='toolbar-item'
                            ref={anchorRef}
                            id="composition-button"
                            aria-controls={menuOpen ? 'composition-menu' : undefined}
                            aria-expanded={menuOpen ? 'true' : undefined}
                            aria-haspopup="true"
                            onClick={handleToggle}
                            // disabled={true}
                            style={{ color: '#8a817c' }}
                            >
                                <FileOpenOutlinedIcon/>
                                Open
                                {/* <i className='format files' /> */}
                                {/* Datasets */}
                        </Button>
                        </Tooltip>
                        <Popper
                            open={menuOpen}
                            anchorEl={anchorRef.current}
                            role={undefined}
                            placement="bottom-start"
                            transition
                            disablePortal
                        >
                            {({ TransitionProps, placement }) => (
                                <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                    placement === 'bottom-start' ? 'left top' : 'left bottom',
                                }}
                                >
                                <Paper>
                                    <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList
                                        autoFocusItem={menuOpen}
                                        id="composition-menu"
                                        aria-labelledby="composition-button"
                                        onKeyDown={handleListKeyDown}
                                    >
                                        {/* <MenuItem onClick={async()=>{
                                            hardReset({ shouldReload: true });
                                            // editor?.selectAll()
                                            // const selectedIds = editor?.getSelectedShapeIds();
                                            // editor?.deleteShapes(editor?.getSelectedShapeIds())
                                            // if (selectedIds && selectedIds.length > 0) {
                                            //     editor?.deleteShapes(selectedIds);
                                            //     // Wait for the deletion to complete by waiting for the next frame
                                            //     await new Promise(resolve => requestAnimationFrame(resolve));
                                            // }
                                            // editor?.deleteShapes(selectedIds);
                                            
                                            editor?.createShapes(tutorial)
                                            editor?.selectAll()
                                            editor?.packShapes(editor?.getSelectedShapeIds(), 30)
                                            editor?.selectNone()
                                            dispatch(setReport(''))
                                            dispatch(setPreReport(''))
                                            dispatch(clearReportHistory())
                                            dispatch(setModifiedGeneration(false));
                                            // await logger.info("DATASET", 'tutorial', {details: tutorial});
                                            // dispatch(setSavedVersions([]));
                                            // dispatch(setVersionDict({}));
                                            // dispatch(setSelectedVersion(""));
                                            handleClose()
                                        }}>tutorial</MenuItem> */}
                                         {/* <MenuItem onClick={async()=>{
                                            editor?.selectAll()
                                            // await hardReset({shouldLoad:true});
                                            editor?.deleteShapes(editor?.getSelectedShapeIds())
                                            editor?.createShapes(yellowstoneShape)
                                            editor?.selectAll()
                                            editor?.packShapes(editor?.getSelectedShapeIds(), 30)
                                            editor?.selectNone()
                                            dispatch(setReport(''))
                                            dispatch(setPreReport(''))
                                            dispatch(clearReportHistory())
                                            dispatch(setModifiedGeneration(false));
                                            await logger.info("DATASET", 'yellowstone', {details: yellowstoneShape});
                                            // dispatch(setSavedVersions([]));
                                            // dispatch(setVersionDict({}));
                                            // dispatch(setSelectedVersion(""));
                                            handleClose()
                                        }}>yellowstoneShape</MenuItem>  */}
                                        {/*<MenuItem onClick={async()=>{
                                            editor?.selectAll()
                                            editor?.deleteShapes(editor?.getSelectedShapeIds())
                                            editor?.selectNone()
                                            dispatch(setReport(''));
                                            dispatch(setPreReport(''))
                                            dispatch(clearReportHistory())
                                            dispatch(setModifiedGeneration(false));
                                            const taskDescription =  "Imagine you are an FBI agent analyzing the related events. The main task is to predict the nature of the terrorists' threat, including when and where this threat will be carried out, who is involved, and what will happen.";
                                            const reportStructure = [
                                                { id: 'introduction', label: 'Introduction', value: "Summarize your findings from those documents and clusters as the first paragraph of the Bottom Line Up Front manner. It should include the necessary information of Who, When, Where, and What." },
                                                { id: 'clusterDescription', label: 'Cluster Analysis', value: "[SUMMARIZATION of each cluster first in a sentence] [ANALYSIS CONTENT must include specific information of Who, When, Where and What. Be as detailed as you can, at least three sentences.]" },
                                                { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: "Provide analysis of sub-clusters within each main cluster, including specific relationships, patterns, and insights that emerge from the sub-cluster analysis." },
                                                { id: 'conclusion', label: 'Conclusion', value: "Draw conclusions of how those clusters connect to each other, inferences, and speculate on causes and effects. Do not re-list the events mentioned here." },
                                            ];
                                            dispatch(setTaskDescription(taskDescription));
                                            dispatch(setReportStructure(reportStructure));
                                            dispatch(setDefaultTaskDescription(taskDescription));
                                            dispatch(setDefaultReportStructure(reportStructure));
                                            // Load the crescent cluster data
                                            editor?.store.loadSnapshot(crescentCluster);
                                            editor?.updateInstanceState({ isFocused: true })
                                            editor.zoomToFit({ duration: 500, padding: 100 });
                                            // await logger.info("DATASET", 'crescent_cluster', {details: crescentCluster});
                                        }} > crescent </MenuItem> */}
                                        <MenuItem onClick={async()=>{
                                            editor?.selectAll()
                                            editor?.deleteShapes(editor?.getSelectedShapeIds())
                                            editor?.selectNone()
                                            dispatch(setReport(''));
                                            dispatch(setPreReport(''))
                                            dispatch(clearReportHistory())
                                            dispatch(setModifiedGeneration(false));
                                            
                                            // Load the yellowstone cluster data
                                            editor?.store.loadSnapshot(yellowstoneCluster);
                                            editor?.updateInstanceState({ isFocused: true })
                                            editor.zoomToFit({ duration: 500, padding: 100 });
                                            const yellowstoneDescription = "";
                                            // const yellowstoneDescription = "You are researching for an upcoming trip. I'm providing you with a collection of structured text about Yellowstone National Park. Your goal is to synthesize this information into a coherent summary report that highlights key insights about the park's characteristics, with each point supported by evidence from the provided text.";
                                            const yellowstoneStructure = [
                                                { id: 'introduction', label: 'Introduction', value: `Provide a "Bottom Line Up Front" (BLUF) executive summary in one paragraph. Answer: "What should a first-time visitor to Yellowstone know?" Synthesize the most critical findings about planning, safety, attractions, and logistics into actionable takeaways.` },
                                                { id: 'clusterDescription', label: 'Cluster Analysis', value: `For each major topic (attractions, logistics, safety, etc.), provide: 1) One-sentence overview, 2) Detailed analysis covering What (key features/activities), Where (specific locations), When (best timing/seasons), and Who (target visitor types).`},
                                                { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: `Analyze subtopics within each main category. Highlight specific relationships, practical considerations, and insider insights that enhance the visitor experience.`},
                                                { id: 'conclusion', label: 'Conclusion', value: `Synthesize how different aspects of Yellowstone connect to create an optimal visit strategy. Focus on: 1) How timing, location choices, and activities interconnect, 2) Key decision points for first-time visitors, 3) Potential challenges and how to mitigate them.` },
                                            ];
                                            dispatch(setTaskDescription(yellowstoneDescription));
                                            dispatch(setReportStructure(yellowstoneStructure));
                                            dispatch(setDefaultTaskDescription(yellowstoneDescription));
                                            dispatch(setDefaultReportStructure(yellowstoneStructure));
                                            // await logger.info("DATASET", 'yellowstone_cluster', {details: yellowstoneCluster});
                                        }} > yellowstone </MenuItem>
                                        <MenuItem 
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            tabIndex={-1}
                                            // startIcon={<CloudUploadIcon />}
                                        >
                                            Upload snapshot
                                            {/* //fileReader */}
                                            <VisuallyHiddenInput id="fileInput"
                                            // <input
                                                type="file"
                                                // onChange={jsonFileUpload}
                                                onChange={(event)=>{
                                                    dispatch(setReport(''));
                                                    dispatch(setPreReport(''))
                                                    dispatch(clearReportHistory())
                                                    dispatch(setModifiedGeneration(false));
                                                    const fileReader = new FileReader();
                                                    // let data = "";
                                                    fileReader.readAsText(event.target.files[0], "UTF-8");
                                                    fileReader.onload = (event) => {
                                                        //   console.log("e.target.result", e.target.result);
                                                        const data = JSON.parse(event.target.result);
                                                        console.log(`[${current()}]`+ "[Space2Think] Uploaded Json Data", data);
                                                        
                                                        // Ensure all store items have meta property to prevent validation errors
                                                        const processedData = ensureMetaProperty(data);
                                                        
                                                        console.log("processedData", processedData);
                                                        localStorage.setItem('my-editor-snapshot', JSON.stringify(processedData));
                                                        const stringified = localStorage.getItem('my-editor-snapshot');
                                                        const snapshot = JSON.parse(stringified);
                                                        editor?.store.loadSnapshot(snapshot);
                                                        editor?.updateInstanceState({ isFocused: true })
                                                        editor.zoomToFit({ duration: 500, padding: 100 });
                                                        // dispatch(setSavedVersions([]));
                                                        // dispatch(setVersionDict({}));
                                                        // dispatch(setSelectedVersion(""));
                                                    };
                                                    handleClose();
                                                }}

                                            />
                                        </MenuItem>
                                        <MenuItem 
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            tabIndex={-1}
                                        >
                                            Upload TXT Files
                                            <VisuallyHiddenInput 
                                                id="txtFileInput"
                                                type="file"
                                                accept=".txt"
                                                multiple
                                                onChange={async (event) => {
                                                    const files = event.target.files;
                                                    if (!files || files.length === 0) {
                                                        return;
                                                    }
                                                    
                                                    dispatch(setReport(''));
                                                    dispatch(setPreReport(''));
                                                    dispatch(clearReportHistory());
                                                    dispatch(setModifiedGeneration(false));
                                                    
                                                    try {
                                                        // Convert txt files to shapes
                                                        const shapes = await convertTxtFilesToShapes(files);
                                                        
                                                        if (shapes.length > 0) {
                                                            // Create shapes in the editor
                                                            editor?.createShapes(shapes);
                                                            // Select all shapes
                                                            editor?.selectAll();
                                                            // Pack shapes with 30px padding
                                                            editor?.packShapes(editor?.getSelectedShapeIds(), 30);
                                                            // Deselect all
                                                            editor?.selectNone();
                                                            
                                                            console.log(`[${current()}] Uploaded ${shapes.length} TXT file(s) as shapes`);
                                                        }
                                                    } catch (error) {
                                                        console.error(`[${current()}] Error uploading TXT files:`, error);
                                                    }
                                                    
                                                    handleClose();
                                                    // Reset the input so the same file can be selected again
                                                    event.target.value = '';
                                                }}
                                            />
                                        </MenuItem>
                                    </MenuList>
                                    </ClickAwayListener>
                                </Paper>
                                </Grow>
                            )}
                        </Popper>
                    <Tooltip title='Save Draft' placement='top'>
                        <Button
                        className='toolbar-item'
                        aria-label='Save Draft'
                        style={{ color: '#8a817c' }}
                        onClick={() => {
                            snapshot.current = editor?.store.getSnapshot()
                            const stringified = JSON.stringify(snapshot)
                            console.log(`[${current()}]`+ "[Space to Think] saved snapshot", stringified)
                            saveSnapshot(stringified)
                        }}
                        >
                        <i className='format save' />
                        Save
                        </Button>
                    </Tooltip>
                    <Divider />
                    <Tooltip title='Search' placement='top'>
                        <Button
                            className='toolbar-item'
                            id = "toolbar-search"
                            style={{ color: '#8a817c' }} 
                            onClick={() => 
                                {
                                    handleSToggle();
                                }
                            }>
                                <SearchIcon />
                                Search
                        </Button>
                    </Tooltip>
                    <Popper
                            open={sMenuOpen}
                            anchorEl={anchorRef.current}
                            role={undefined}
                            placement="bottom-end"
                            transition
                            disablePortal
                        >
                            {({ TransitionProps, placement }) => (
                                <Grow
                                {...TransitionProps}
                                style={{
                                    transformOrigin:
                                    placement === 'bottom-end' ? 'left bottom' : 'left top',
                                }}
                                >
                                <Paper>
                                    <Box>
                                    <ClickAwayListener onClickAway={handleSClose}>
                                    <MenuList 
                                        autoFocusItem={sMenuOpen}
                                        id="composition-menu"
                                        aria-labelledby="composition-button"
                                        // onKeyDown={handleListKeyDown}
                                    >
                                        <MenuItem >
                                        <TextField 
                                            id="search" 
                                            // label="Search field" 
                                            placeholder='Search field'
                                            // variant="filled" 
                                            onClick={(event) => event.stopPropagation()}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                        <SearchIcon /> 
                                            {/* <button>Search</button> */}
                                            {/* <Button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    console.log(search);
                                                    }}>
                                                     Search
                                            </Button> */}
                                        </MenuItem>
                                         </MenuList>
                                         </ClickAwayListener>
                                    </Box>
                                    <Box style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {/* <ClickAwayListener onClickAway={handleSClose}> */}
                                        <MenuList >
                                            {/* 
                                            > */}
                                            {searchResult.map((item) => (
                                                <MenuItem 
                                                style = {{color: 'green'}}
                                                onClick={async (event) => {
                                                    console.log(`[${current()}]`+ "[Space2Think] clicked item from search")
                                                    event.stopPropagation()
                                                    
                                                    // Set the clicked node key to trigger highlighting
                                                    dispatch(setCurClickedNodeKey(item.name));
                                                    
                                                    // Move camera to the item position
                                                    if (editor && item.positionX !== undefined && item.positionY !== undefined) {
                                                        const cameraX = -item.positionX + (drawerOpen ? 200 : 400);
                                                        const cameraY = -item.positionY + 300;
                                                        const cameraZ = 1;
                                                        
                                                        console.log(`[${current()}]`+ "[Space2Think] Moving camera to:", cameraX, cameraY, cameraZ);
                                                        await logger.logUserAction("[Space2Think] Moving camera to searched item", {
                                                            details: { positionX: item.positionX, positionY: item.positionY, cameraX, cameraY, cameraZ }
                                                        });
                                                        
                                                        // editor.setCamera(
                                                        //     { x: cameraX, y: cameraY, z: cameraZ }, 
                                                        //     { duration: 500, easing: (t) => t * t }
                                                        // );
                                                        
                                                        // Select the item after camera movement
                                                        setTimeout(() => {
                                                            if (item.id) {
                                                                editor.select(item.id);
                                                            }
                                                        }, 600);
                                                    }
                                                }}
                                                >
                                                {item.name}: {item.content}
                                                </MenuItem>
                                            ))}
                                            {/* <MenuItem onClick={()=>{}}>Crescent</MenuItem> */}
                                        </MenuList>
                                    {/* </ClickAwayListener> */}
                                    </Box>
                                    
                                </Paper>
                                </Grow>
                            )}
                        </Popper>
                    <Divider />
                    <Tooltip title={reportHistory.length > 0 ? 'Refine report' : 'Generate report'} placement='top'>
                        <Button
                            className='toolbar-item'
                            id = "toolbar-report"
                            // style={{ color: '#8a817c' }}
                            onClick={handleGenerateReport}
                        >
                        <i className='format chatgpt' />
                           {reportHistory.length > 0 ? 'Report Refinement' : 'Report Generation'}
                        </Button>
                    </Tooltip>
                    
                    </div>
                    <div className='toolbar-right'>
                        <Tooltip title='Tutorial' placement='top'>
                            <Button
                                className='toolbar-item'
                                style={{ color: '#8a817c' }}
                                onClick={() => setTutorialVisible(true)}
                            >
                                <HelpOutlineIcon />
                                Tutorial
                            </Button>
                        </Tooltip>
                        <Tooltip title='API key' placement='top'>
                            <Button
                                className='toolbar-item'
                                style={{ color: '#8a817c' }}
                                onClick={() => setApiKeyDialogOpen(true)}
                            >
                                <KeyIcon />
                                API key
                            </Button>
                        </Tooltip>
                    <Divider />
                        {!drawerOpen ? (
                            <Tooltip title='Show drawer' placement='top'>
                            <Button
                                className='toolbar-item'
                                style={{ color: '#8a817c' }}
                                onClick={() => {
                                    dispatch(setDrawerOpen())
                                    console.log(`[${current()}]`+ "[Space2Think] drawerOpen")
                                }}
                            >
                                <ArrowCircleLeftOutlinedIcon />
                            </Button>
                            </Tooltip>
                        ) : (
                            <Tooltip title='Hide drawer' placement='top'>
                            <Button
                                className='toolbar-item'
                                style={{ color: '#8a817c' }}
                                onClick={() => {
                                    dispatch(setDrawerClose())
                                    console.log(`[${current()}]`+ "[Space2Think] drawerHide")
                                }}
                            >
                                <ArrowCircleRightOutlinedIcon />
                            </Button>
                            </Tooltip>
                        )}
                        </div>
                </div>
            </AppBar>
            <div
                style={{
                    position: 'fixed',
                    left: 24,
                    bottom: 24,
                    zIndex: 1400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    width: 500,
                }}
                >
                {isReactDone && loading && refineReactMessage.Space_command && (
                    <>
                        {(refineReactMessage.Space_reasoning || refineReactMessage.Prompt_reasoning) && (
                            <Alert severity="warning" variant="filled" onClose={() => setIsReactDone(false)}>
                                <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Reasoning:</span>
                                {refineReactMessage.Space_reasoning && (
                                    <span style={{ marginLeft: 8 }}>Space: {refineReactMessage.Space_reasoning}</span>
                                )}
                                {refineReactMessage.Space_reasoning && refineReactMessage.Prompt_reasoning && (
                                    <span style={{ marginLeft: 8, marginTop: 4, display: 'block' }}>---</span>
                                )}
                                {refineReactMessage.Prompt_reasoning && (
                                    <span style={{ marginLeft: 8, marginTop: 4, display: 'block' }}>Prompt: {refineReactMessage.Prompt_reasoning}</span>
                                )}
                            </Alert>
                        )}
                        <Alert severity="success" variant="filled" onClose={() => setIsReactDone(false)}>
                            <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Refining:</span>
                            {refineReactMessage.Space_command && (
                                <span style={{ marginLeft: 8 }}>Space: {refineReactMessage.Space_command}</span>
                            )}
                            {refineReactMessage.Space_command && refineReactMessage.Prompt_command && (
                                <span style={{ marginLeft: 8, marginTop: 4, display: 'block' }}>---</span>
                            )}
                            {refineReactMessage.Prompt_command && (
                                <span style={{ marginLeft: 8, marginTop: 4, display: 'block' }}>Prompt: {refineReactMessage.Prompt_command}</span>
                            )}
                        </Alert>
                    </>
                )}
                {loading && (
                    <Alert severity="info" variant="filled">
                    LLM is working...
                    </Alert>
                )}
                {reportApiError && (
                    <Alert severity="error" variant="filled" onClose={() => setReportApiError('')}>
                        {reportApiError}
                        {' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => { setReportApiError(''); setApiKeyDialogOpen(true); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReportApiError(''); setApiKeyDialogOpen(true); } }}
                            style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Change API key
                        </span>
                    </Alert>
                )}

            </div>
            <Snackbar
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
                open={reportFinish}
                autoHideDuration={1200}
                onClose={() => setReportFinish(false)}
                >
                <Alert serverity="success"> LLM Generation Done </Alert>
            </Snackbar>
            <Snackbar
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
                }}
                open={frameErrorOpen}
                autoHideDuration={4000}
                onClose={() => setFrameErrorOpen(false)}
                >
                <Alert severity="warning">You need at least one frame for report generation</Alert>
            </Snackbar>
            <ApiKeyDialog 
                open={apiKeyDialogOpen}
                onClose={() => {
                    setApiKeyDialogOpen(false);
                    setApiKeyError('');
                }}
                error={apiKeyError}
            />
            <Main open={drawerOpen} drawerWidth={drawerWidth}>
                <div className='editor_space' id='editor_space' style={{ height: `${windowHeight-50}px`}} >
                    <Tldraw 
                        // hideUi
                        shapeUtils={customShape}
                        components={MenuComponents}
                        onMount={(editor) => {setEditor(editor); editorRef.current = editor;}}  
                    >
                        <CustomUi />
                        
                    </Tldraw>
                </div>
            </Main>
            </div>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    position: 'relative',
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        position: 'fixed',
                        transition: 'none',
                        overflowX: 'hidden'
                    }
                }}
                variant='persistent'
                anchor='right'
                open={drawerOpen}
                id = "drawer-report"
            >
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        left: 0,
                        top: 0, 
                        bottom: 0, 
                        width: '5px', 
                        cursor: 'col-resize',
                        zIndex: 1200,
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        },
                        '&:active': {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        }
                    }}
                    onMouseDown={handleMouseDown}
                />
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange}>
                        <Tab label="Prompt Settings" id="prompt-settings" />
                        <Tab label="Model settings" id="model-settings" />
                        <Tab label="Report" id="report-editor" />
                    </Tabs>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <div style={{ 
                        display: currentTab === 0 ? 'block' : 'none',
                        height: '100%'
                    }}>
                        <PromptTab />
                    </div>
                    <div style={{ 
                        display: currentTab === 1 ? 'block' : 'none',
                        height: '100%'
                    }}>
                        <ModelSettings settings={modelSettings} setSettings={setModelSettings} />
                    </div>
                    <div style={{ 
                        display: currentTab === 2 ? 'block' : 'none',
                        height: '100%'
                    }}>
                        <ReportEditor />
                    </div>
                </Box>
            </Drawer>

            {/* Tutorial Manager */}
            <TutorialManager
                editor={editor}
                dispatch={dispatch}
                isVisible={tutorialVisible}
                onClose={() => setTutorialVisible(false)}
            />
        </Box>
    
    );
}