import { configureStore } from '@reduxjs/toolkit'
import EditorReducer from '../modules/LexicalEditor/slices/EditorSlice'
import SpaceReducer from '../modules/LexicalEditor/slices/SpaceSlice'

export const store = configureStore({
    reducer: {
        editor: EditorReducer,
        space: SpaceReducer, 
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
