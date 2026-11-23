import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import TutorialOverlay from './TutorialOverlay';
import { tutorialSteps } from './tutorialSteps';
import { tutorialConfig } from './tutorialSteps';
import tutorialDataManager from './tutorialData';
import { logger } from '../../../utils/logger.js';
import { current } from '../../LexicalEditor/time.js';

const TutorialManager = ({ editor, dispatch, isVisible, onClose }) => {
    const [tutorialState, setTutorialState] = useState({
        isRunning: false,
        currentStep: 0,
        showInfo: false,
        showCompletion: false
    });

    const [run, setRun] = useState(false);

    // Initialize tutorial data manager
    useEffect(() => {
        if (editor && tutorialState.isRunning) {
            tutorialDataManager.totalSteps = tutorialSteps.length;
        }
    }, [editor, tutorialState.isRunning]);

    // Handle tutorial start
    const handleTutorialStart = useCallback(async () => {
        if (!editor) {
            console.error('Editor not available for tutorial');
            return;
        }

        try {
            // Initialize tutorial with Yellowstone data
            const success = tutorialDataManager.initializeTutorial(editor, dispatch);
            
            if (success) {
                setTutorialState(prev => ({ ...prev, isRunning: true }));
                setRun(true);
                
                // Log tutorial start
                await logger.logUserAction("[Tutorial] Started Yellowstone tutorial", {
                    details: {
                        timestamp: new Date().toISOString(),
                        editor: !!editor,
                        steps: tutorialSteps.length
                    }
                });
                
                // Tutorial started successfully
            } else {
                // Failed to initialize tutorial
            }
        } catch (error) {
            // Handle tutorial start error
        }
    }, [editor, dispatch]);

    // Handle tutorial step change
    const handleStepChange = useCallback((data) => {
        const { index } = data;
        setTutorialState(prev => ({ ...prev, currentStep: index }));
        
        // Track step visit
        tutorialDataManager.markStepVisited(index);
        tutorialDataManager.trackInteraction(index, 'step_visited', { stepIndex: index });
        
        // Step visited
    }, []);

    // Handle tutorial completion
    const handleTutorialComplete = useCallback(async (data) => {
        setTutorialState(prev => ({ 
            ...prev, 
            isRunning: false, 
            showCompletion: true 
        }));
        setRun(false);
        
        // Complete tutorial in data manager
        tutorialDataManager.completeTutorial();
        
        // Log completion
        await logger.logUserAction("[Tutorial] Completed Yellowstone tutorial", {
            details: {
                timestamp: new Date().toISOString(),
                totalSteps: tutorialSteps.length,
                completionData: tutorialDataManager.exportTutorialData()
            }
        });
        
                        // Tutorial completed successfully
    }, []);

    // Handle tutorial skip
    const handleTutorialSkip = useCallback(async () => {
        setTutorialState(prev => ({ ...prev, isRunning: false }));
        setRun(false);
        
        // Reset tutorial
        tutorialDataManager.resetTutorial();
        
        // Log skip
        await logger.logUserAction("[Tutorial] Skipped Yellowstone tutorial", {
            details: {
                timestamp: new Date().toISOString(),
                currentStep: tutorialState.currentStep,
                totalSteps: tutorialSteps.length
            }
        });
        
                        // Tutorial skipped
    }, [tutorialState.currentStep]);

    // Handle tutorial close
    const handleTutorialClose = useCallback(async () => {
        setTutorialState(prev => ({ ...prev, isRunning: false }));
        setRun(false);
        
        // Reset tutorial
        tutorialDataManager.resetTutorial();
        
        // Log close
        await logger.logUserAction("[Tutorial] Closed Yellowstone tutorial", {
            details: {
                timestamp: new Date().toISOString(),
                currentStep: tutorialState.currentStep,
                totalSteps: tutorialSteps.length
            }
        });
        
        onClose && onClose();
    }, [tutorialState.currentStep, onClose]);

    // Show tutorial info
    const handleShowInfo = () => {
        setTutorialState(prev => ({ ...prev, showInfo: true }));
    };

    // Close tutorial info
    const handleCloseInfo = () => {
        setTutorialState(prev => ({ ...prev, showInfo: false }));
    };

    // Close completion dialog
    const handleCloseCompletion = () => {
        setTutorialState(prev => ({ ...prev, showCompletion: false }));
        handleTutorialClose();
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Tutorial Overlay */}
            <TutorialOverlay
                isVisible={isVisible}
                onClose={handleTutorialClose}
                onStart={handleTutorialStart}
                steps={tutorialSteps}
                run={run}
                onStepChange={handleStepChange}
                onComplete={handleTutorialComplete}
                onSkip={handleTutorialSkip}
            />

            {/* Tutorial Info Dialog */}
            <Dialog 
                open={tutorialState.showInfo} 
                onClose={handleCloseInfo}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <InfoIcon color="primary" />
                        {tutorialConfig.title}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        {tutorialConfig.description}
                    </Typography>
                    
                    <Box display="flex" gap={1} mb={2}>
                        <Chip 
                            label={`⏱️ ${tutorialConfig.estimatedTime}`} 
                            color="primary" 
                            variant="outlined" 
                        />
                        <Chip 
                            label={`📊 ${tutorialConfig.difficulty}`} 
                            color="secondary" 
                            variant="outlined" 
                        />
                        <Chip 
                            label={`🗂️ ${tutorialConfig.dataset}`} 
                            color="info" 
                            variant="outlined" 
                        />
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                        What You'll Learn:
                    </Typography>
                    <List dense>
                        {tutorialConfig.features.map((feature, index) => (
                            <ListItem key={index}>
                                <ListItemText 
                                    primary={feature}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" gutterBottom>
                        Quick Start:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click the "Start Tutorial" button to begin your Yellowstone National Park exploration journey. 
                        The tutorial will automatically load the Yellowstone dataset and guide you through each feature step-by-step.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseInfo}>Close</Button>
                    <Button 
                        onClick={() => {
                            handleCloseInfo();
                            handleTutorialStart();
                        }}
                        variant="contained" 
                        color="primary"
                        startIcon={<PlayArrowIcon />}
                    >
                        Start Tutorial
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tutorial Completion Dialog */}
            <Dialog 
                open={tutorialState.showCompletion} 
                onClose={handleCloseCompletion}
                maxWidth="sm"
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <PlayArrowIcon color="success" />
                        Tutorial Complete! 🎉
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" paragraph>
                        Congratulations! You've successfully completed the system tutorial.
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom>
                        You've learned how to:
                    </Typography>
                    <List dense>
                        {tutorialConfig.features.slice(0, 3).map((feature, index) => (
                            <ListItem key={index}>
                                <ListItemText 
                                    primary={feature}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                    
                    <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
                        <Typography variant="body2" color="success.contrastText">
                            🏔️ You're now ready to explore the system independently!
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCompletion} variant="contained" color="primary">
                        Continue Exploring
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TutorialManager;
export { tutorialSteps, tutorialConfig, tutorialDataManager }; 