import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DragIndicator, Add, Delete, Edit } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
    setTaskDescription,
    setReportStructure,
} from '../../LexicalEditor/slices/SpaceSlice.js'
import {
    useDispatch,
    useSelector
} from 'react-redux';
import { logger } from '../../../utils/logger.js';

export function PromptTab() {
  const dispatch = useDispatch();
  const taskDescription = useSelector(state => state.space.taskDescription);
  const reportStructure = useSelector(state => state.space.reportStructure);
  const defaultTaskDescription = useSelector(state => state.space.defaultTaskDescription);
  const defaultReportStructure = useSelector(state => state.space.defaultReportStructure);

  const [taskD, setTaskD] = useState(taskDescription);
  const [localReportStructure, setLocalReportStructure] = useState(reportStructure);

  // Update local state when Redux state changes
  useEffect(() => {
    setTaskD(taskDescription);
  }, [taskDescription]);

  useEffect(() => {
    setLocalReportStructure(reportStructure);
  }, [reportStructure]);

  // Track which field is being edited
  const [editingField, setEditingField] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    fieldId: null,
    fieldLabel: ''
  });

  // Track the last saved values to detect when edits are completed
  const lastSavedTaskD = useRef(taskDescription);
  const lastSavedReportStructure = useRef(reportStructure);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(localReportStructure);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalReportStructure(items);
    
    // Log reorder completion after a brief delay to ensure state is updated
    setTimeout(() => handleReorderComplete(), 100);
  };

  const addCustomField = () => {
    const newId = `custom-${Date.now()}`;
    const newField = {
      id: newId,
      label: `Custom Section ${localReportStructure.length + 1}`,
      value: ''
    };
    setLocalReportStructure([...localReportStructure, newField]);
  };

  const openDeleteDialog = (id, label) => {
    setDeleteDialog({
      open: true,
      fieldId: id,
      fieldLabel: label
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      fieldId: null,
      fieldLabel: ''
    });
  };

  const confirmDelete = () => {
    const { fieldId } = deleteDialog;
    setLocalReportStructure(localReportStructure.filter(field => field.id !== fieldId));
    closeDeleteDialog();
  };

  const startEditing = (id) => {
    setEditingField(id);
  };

  const stopEditing = () => {
    setEditingField(null);
  };

  const updateFieldLabel = (id, newLabel) => {
    setLocalReportStructure(prev => 
      prev.map(field => 
        field.id === id ? { ...field, label: newLabel } : field
      )
    );
  };

  const updateFieldValue = (id, newValue) => {
    setLocalReportStructure(prev => 
      prev.map(field => 
        field.id === id ? { ...field, value: newValue } : field
      )
    );
  };

  // Auto-save task description changes
  useEffect(() => {
    if (taskD !== taskDescription) {
      dispatch(setTaskDescription(taskD));
    }
  }, [taskD, dispatch]);

  // Auto-save report structure changes
  useEffect(() => {
    if (JSON.stringify(localReportStructure) !== JSON.stringify(reportStructure)) {
      dispatch(setReportStructure(localReportStructure));
    }
  }, [localReportStructure, dispatch]);

  // Handle task description edit completion
  const handleTaskDescriptionBlur = () => {
    if (taskD !== lastSavedTaskD.current && taskD !== '') {
      console.log("[PromptTab] Task description edit completed: ", taskD);
      logger.logUserAction("[PromptTab] Task description edit completed", {details: taskD});
      lastSavedTaskD.current = taskD;
    }
  };

  // Handle report structure field edit completion
  const handleReportFieldBlur = (fieldId, fieldValue) => {
    console.log(`[PromptTab] Report field edit completed - ${fieldId}: `, fieldValue);
    logger.logUserAction(`[PromptTab] Report field edit completed - ${fieldId}`, {details: fieldValue});
  };

  // Handle report structure reorder completion
  const handleReorderComplete = () => {
    if (JSON.stringify(localReportStructure) !== JSON.stringify(lastSavedReportStructure.current)) {
      console.log("[PromptTab] Report structure reorder completed: ", localReportStructure);
      logger.logUserAction("[PromptTab] Report structure reorder completed", {details: localReportStructure});
      lastSavedReportStructure.current = [...localReportStructure];
    }
  };

  const handleSave = async () => {
    // This function is now redundant but kept for backward compatibility
    console.log("[PromptTab] Manual save triggered");
    await logger.logUserAction("[PromptTab] Manual save triggered");
  };

  const handleReset = () => {
    setTaskD(defaultTaskDescription);
    setLocalReportStructure(defaultReportStructure);
    setEditingField(null);
    closeDeleteDialog();
  };

  return (
    <Box sx={{ p: 2, height: '99%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Prompt Settings
      </Typography>
      
      {/* Task Description Section */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
          Task Description
        </Typography>
        <TextField 
          multiline
          maxRows={4}
          fullWidth
          size="small"
          value={taskD} 
          onChange={e => setTaskD(e.target.value)}
          onBlur={handleTaskDescriptionBlur}
          placeholder="Enter task description..."
        />
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Report Structure Section */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} color="secondary.main">
            Report Structure
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={addCustomField}
            sx={{ minWidth: 'auto' }}
          >
            Add Section
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag and drop to reorder the sections
        </Typography>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="reportStructure">
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {localReportStructure
                  .filter(field => field.id !== 'subClusterDescription')
                  .map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: snapshot.isDragging ? 'primary.main' : 'orange',
                          borderRadius: 1,
                          backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          cursor: 'grab',
                          '&:active': {
                            cursor: 'grabbing'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <DragIndicator 
                            sx={{ 
                              mr: 1, 
                              color: 'text.secondary',
                              fontSize: 20,
                              cursor: 'grab',
                              '&:active': {
                                cursor: 'grabbing'
                              }
                            }} 
                          />
                          {field.id !== 'clusterDescription' ? (
                            editingField === field.id ? (
                              <TextField
                                size="small"
                                value={field.label}
                                onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                                onBlur={stopEditing}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    stopEditing();
                                  }
                                }}
                                autoFocus
                                sx={{ 
                                  mr: 1, 
                                  minWidth: 150,
                                  '& .MuiInputBase-input': { 
                                    fontWeight: 600,
                                    padding: '4px 8px'
                                  }
                                }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                <Typography fontWeight={600} sx={{ mr: 1 }}>
                                  {field.label}:
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => startEditing(field.id)}
                                  sx={{ 
                                    color: 'text.secondary',
                                    '&:hover': { color: 'primary.main' }
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Box>
                            )
                          ) : (
                            <Typography fontWeight={600}>
                              Cluster Analysis:
                            </Typography>
                          )}
                          {field.id !== 'clusterDescription' && (
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(field.id, field.label)}
                              sx={{ 
                                ml: 'auto',
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main' }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        
                        {/* Cluster Description Input */}
                        <TextField 
                          multiline
                          maxRows={4}
                          fullWidth
                          size="small"
                          value={field.value} 
                          onChange={e => updateFieldValue(field.id, e.target.value)}
                          onBlur={() => handleReportFieldBlur(field.id, field.value)}
                          placeholder="Enter cluster analysis instructions..."
                          sx={{ mb: 2 }}
                        />
                        
                        {/* Sub-Cluster Description Input - only show for clusterDescription */}
                        {field.id === 'clusterDescription' && (
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500 }}>
                              Sub-Cluster Analysis:
                            </Typography>
                            <TextField 
                              multiline
                              maxRows={3}
                              fullWidth
                              size="small"
                              value={localReportStructure.find(f => f.id === 'subClusterDescription')?.value || ''} 
                              onChange={e => updateFieldValue('subClusterDescription', e.target.value)}
                              onBlur={() => handleReportFieldBlur('subClusterDescription', localReportStructure.find(f => f.id === 'subClusterDescription')?.value || '')}
                              placeholder="Enter sub-cluster analysis instructions..."
                              sx={{ 
                                '& .MuiInputBase-root': { 
                                  backgroundColor: 'action.hover',
                                  border: '1px dashed',
                                  borderColor: 'divider'
                                }
                              }}
                            />
                          </>
                        )}
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="outlined" 
          size="small"
          onClick={handleSave}
          disabled
          sx={{ opacity: 0.6 }}
        >
          Auto-save Enabled
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          color="warning"
          onClick={handleReset}
        >
          Reset
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the section "{deleteDialog.fieldLabel}"? 
            This action cannot be undone and the section will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 