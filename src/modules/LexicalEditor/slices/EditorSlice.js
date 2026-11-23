import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit'
import { key } from 'localforage';

const initialState = {
  report: "",
  UserKeywords: {},
  keywords:{},
  modifiedJson: "",
  ModifiedState: false,
  modifiedGeneration: false,
  nodeKeys: [],
  nodeContent: [],
  underLineNodeKeys: [],
  curClickedNodeKey: "",
  newHl: "",
  adoptHl: "",
  rmHl: "",
  preReport: "",
  preSnapshot: "",
  currentSnapshot: "",
  reportHistory: [],
  paragraphNodes: {},
  savedVersions: [],
  versionDict: {},
  selectedVersion: "",
}
const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurClickedNodeKey (state, action) {
      return {
        ...state,
        curClickedNodeKey: action.payload
      }
    },
    setCurClickedCiteKey (state, action) {
      return {
        ...state,
        curClickedCiteKey: action.payload
      }
    },
    setReport (state, action){
      const report = action.payload
      return {
        ...state,
        report: report
      }
    },
    setUserKeywords (state, action) {
      const keywords = action.payload
      return {
        ...state,
        UserKeywords: keywords
      }
    },
    setKeywords (state, action) {
      const keywords = action.payload
      return {
        ...state,
        keywords: keywords
      }
    },
    setModifiedJson (state, action) {
      const modifiedJson = action.payload
      return {
        ...state,
        modifiedJson: modifiedJson
      }
    },
    setModifiedState (state, action) {
      const ModifiedState = action.payload
      return {
        ...state,
        ModifiedState: ModifiedState
      }
    },
    setNodeKeys (state, action) {
      const nodeKeys = action.payload
      return {
        ...state,
        nodeKeys: nodeKeys
      }
    },
    setNodeContent (state, action) {
      const nodeContent = action.payload
      return {
        ...state,
        nodeContent: nodeContent
      }
    },
    setunderLineNodeKeys (state, action) {
      const underLineNodeKeys = action.payload
      // console.log('[EditorSlice] underLineNodeKeys', underLineNodeKeys)
      return {
        ...state,
        underLineNodeKeys: underLineNodeKeys
      }
    },
    setNewHl (state, action) {
      const newHl = action.payload
      return {
        ...state,
        newHl: newHl
      }
    },
    setAdoptHl (state, action) {
      const adoptHl = action.payload
      return {
        ...state,
        adoptHl: adoptHl
      }
    },
    setRmHl (state, action) {
      const rmHl = action.payload
      return {
        ...state,
        rmHl: rmHl
      }
    },
    setPreReport (state, action) {
      const preReport = action.payload
      return {
        ...state,
        preReport: preReport
      }
    },
    setModifiedGeneration (state, action) {
      const modifiedGeneration = action.payload
      return {
        ...state,
        modifiedGeneration: modifiedGeneration
      }
    },
    setPreSnapshot (state, action) {
      const preSnapshot = action.payload
      return {
        ...state,
        preSnapshot: preSnapshot
      }
    },
    setCurrentSnapshot (state, action) {
      const currentSnapshot = action.payload
      return {
        ...state,
        currentSnapshot: currentSnapshot
      }
    },
    setParagraphNodes (state, action) {
      const paragraphNodes = action.payload
      return {
        ...state,
        paragraphNodes: paragraphNodes
      }
    },
    addToReportHistory (state, action) {
      const newReport = action.payload
      const timestamp = new Date().toISOString()
      const reportEntry = {
        id: timestamp,
        report: newReport,
      }
      return {
        ...state,
        reportHistory: [...state.reportHistory, reportEntry]
      }
    },
    clearReportHistory (state) {
      return {
        ...state,
        reportHistory: []
      }
    },
    removeFromReportHistory (state, action) {
      const reportId = action.payload
      return {
        ...state,
        reportHistory: state.reportHistory.filter(report => report.id !== reportId)
      }
    },
    setSavedVersions (state, action) {
      const savedVersions = action.payload
      return {
        ...state,
        savedVersions: savedVersions
      }
    },
    setVersionDict (state, action) {
      const versionDict = action.payload
      return {
        ...state,
        versionDict: versionDict
      }
    },
    setSelectedVersion (state, action) {
      const selectedVersion = action.payload
      return {
        ...state,
        selectedVersion: selectedVersion
      }
    }
  },
  extraReducers: builder => {

  }
})

export const {
  setCurClickedNodeKey,
  setCurClickedCiteKey,
  setReport,
  setUserKeywords,
  setKeywords,
  setModifiedJson,
  setModifiedState,
  setNodeKeys,
  setNodeContent,
  setunderLineNodeKeys,
  setNewHl,
  setAdoptHl,
  setRmHl,
  setPreReport,
  setPreSnapshot,
  setCurrentSnapshot,
  setParagraphNodes,
  addToReportHistory,
  clearReportHistory,
  removeFromReportHistory,
  setModifiedGeneration,
  setSavedVersions,
  setVersionDict,
  setSelectedVersion,
} = editorSlice.actions

export default editorSlice.reducer
