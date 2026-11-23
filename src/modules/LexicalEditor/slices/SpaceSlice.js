import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit'

const initialState = {
  drawerOpen: true,
  reportOpen: false,
  highlightDoc: null,
  selectedId: "",
  selectedItems: [],
  selectedEntity: "",
  selectedCite: "",
  selectedContainerClass: "",
  promptOpen: false,
  taskDescription: "Imagine you are an FBI agent analyzing the related events. The main task is to predict the nature of the terrorists' threat, including when and where this threat will be carried out, who is involved, and what will happen.",
  reportStructure: [
    { id: 'introduction', label: 'Introduction', value: "Summarize your findings from those documents and clusters as the first paragraph of the Bottom Line Up Front manner. It should include the necessary information of Who, When, Where, and What." },
    { id: 'clusterDescription', label: 'Cluster Analysis', value: "[SUMMARIZATION of each cluster first in a sentence] [ANALYSIS CONTENT must include specific information of Who, When, Where and What. Be as detailed as you can, at least three sentences.]" },
    { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: "Provide analysis of sub-clusters within each main cluster, including specific relationships, patterns, and insights that emerge from the sub-cluster analysis." },
    { id: 'conclusion', label: 'Conclusion', value: "Draw conclusions of how those clusters connect to each other, inferences, and speculate on causes and effects. Do not re-list the events mentioned here." },
  ],
  defaultTaskDescription: "Imagine you are an FBI agent analyzing the related events. The main task is to predict the nature of the terrorists' threat, including when and where this threat will be carried out, who is involved, and what will happen.",
  defaultReportStructure: [
    { id: 'introduction', label: 'Introduction', value: "Summarize your findings from those documents and clusters as the first paragraph of the Bottom Line Up Front manner. It should include the necessary information of Who, When, Where, and What." },
    { id: 'clusterDescription', label: 'Cluster Analysis', value: "[SUMMARIZATION of each cluster first in a sentence] [ANALYSIS CONTENT must include specific information of Who, When, Where and What. Be as detailed as you can, at least three sentences.]" },
    { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: "Provide analysis of sub-clusters within each main cluster, including specific relationships, patterns, and insights that emerge from the sub-cluster analysis." },
    { id: 'conclusion', label: 'Conclusion', value: "Draw conclusions of how those clusters connect to each other, inferences, and speculate on causes and effects. Do not re-list the events mentioned here." },
  ],
  previousTaskDescription: "",
  previousReportStructure: [],
  refineReactMessage: "",
  reportRefineSettings: {
    reasoning_model: "gpt-4o-mini",
    reasoning_max_tokens: 1000,
    reasoning_temperature: 0,
    refine_model: "gpt-4o-mini",
    refine_max_tokens: 10000,
    refine_temperature: 0,
  },
  previousReportRefineSettings: {},
  preSelectedShape: [],
}

const SpaceSlice = createSlice({
  name: 'space',
  initialState,
  reducers: {
    setReportOpen (state, action) {
      return {
        ...state,
        reportOpen: true
      }
    },
    setReportClose (state, action) {
      return {
        ...state,
        reportOpen: false
      }
    },
    setDrawerOpen (state, action) {
      // console.log('set Modal Open is called');
      return {
        ...state,
        drawerOpen: true
      }
    },
    setDrawerClose (state, action) {
      return {
        ...state,
        drawerOpen: false
      }
    },
    setHighlightDoc (state, action) {
      return {
        ...state,
        highlightDoc: action.payload
      }
    },
    setSelectedId (state, action) {
      return {
        ...state,
        selectedId: action.payload
      }
    },
    setSelectedItems (state, action) {
      return {
        ...state,
        selectedItems: action.payload
      }
    },
    setSelectedEntity (state, action) {
      // console.log('[SpaceSlice] SelectedEntity', action.payload)
      return {
        ...state,
        selectedEntity: action.payload
      }
    },
    setSelectedCite (state, action) {
      return {
        ...state,
        selectedCite: action.payload
      }
    },
    setSelectedContainerClass (state, action) {
      return {
        ...state,
        selectedContainerClass: action.payload
      }
    },
    setPromptOpen (state, action) {
      return {
        ...state,
        promptOpen: action.payload
      }
    },
    setTaskDescription (state, action) {
      return {
        ...state,
        taskDescription: action.payload
      }
    },
    setReportStructure (state, action) {
      return {
        ...state,
        reportStructure: action.payload
      }
    },
    setRefineReactMessage (state, action) {
      return {
        ...state,
        refineReactMessage: action.payload
      }
    },
    setReportRefineSettings (state, action) {
      return {
        ...state,
        reportRefineSettings: action.payload
      }
    },
    setPreviousReportRefineSettings (state, action) {
      return {
        ...state,
        previousReportRefineSettings: action.payload
      }
    },
    setPreviousReportStructure (state, action) {
      return {
        ...state,
        previousReportStructure: action.payload
      }
    },
    setPreviousTaskDescription (state, action) {
      return {
        ...state,
        previousTaskDescription: action.payload
      }
    },
    setDefaultTaskDescription (state, action) {
      return {
        ...state,
        defaultTaskDescription: action.payload
      }
    },
    setDefaultReportStructure (state, action) {
      return {
        ...state,
        defaultReportStructure: action.payload
      }
    },
    setPreSelectedShape (state, action) {
      return {
        ...state,
        preSelectedShape: action.payload
      }
    },
    // setIntroduction (state, action) {
    //   return {
    //     ...state,
    //     introduction: action.payload
    //   }
    // },
    // setClusterDescription (state, action) {
    //   return {
    //     ...state,
    //     clusterDescription: action.payload
    //   }
    // },
    // setConclusion (state, action) {
    //   return {
    //     ...state,
    //     conclusion: action.payload
    //   }
    // }
    
  },
  extraReducers: builder => {
  }
})

export const {
  setDrawerOpen,
  setDrawerClose,
  setHighlightDoc,
  setSelectedId,
  setSelectedItems,
  setSelectedEntity,
  setSelectedCite,
  setSelectedContainerClass,
  setPromptOpen,
  // setClusterDescription,
  // setConclusion,
  // setIntroduction,
  setTaskDescription,
  setReportOpen,
  setReportClose,
  setReportStructure,
  setRefineReactMessage,
  setReportRefineSettings,
  setPreviousReportRefineSettings,
  setPreviousReportStructure,
  setPreviousTaskDescription,
  setDefaultTaskDescription,
  setDefaultReportStructure,
  setPreSelectedShape,
} = SpaceSlice.actions

export default SpaceSlice.reducer
