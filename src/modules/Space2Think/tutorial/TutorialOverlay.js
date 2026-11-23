import React, { useState, useEffect, useRef } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { Box, Button, Typography, IconButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CloseIcon from '@mui/icons-material/Close';
import './tutorialStyles.css';

const TutorialOverlay = ({ 
    isVisible, 
    onClose, 
    onStart, 
    steps, 
    run, 
    onStepChange,
    onComplete,
    onSkip
}) => {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const handleStart = () => {
        setIsRunning(true);
        onStart && onStart();
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleSkip = () => {
        setIsRunning(false);
        onSkip && onSkip();
    };

    const handleClose = () => {
        setIsRunning(false);
        onClose && onClose();
    };

    const handleStepChange = (data) => {
        onStepChange && onStepChange(data);
    };

    const handleComplete = (data) => {
        setIsRunning(false);
        onComplete && onComplete(data);
    };

    if (!isVisible) return null;

    return (
        <div className="tutorial-overlay">
            {/* Tutorial Controls */}
            <Box className="tutorial-controls">
                <Typography variant="h6" className="tutorial-title">
                    System Tutorial
                </Typography>
                
                <Box className="tutorial-control-buttons">
                    {!isRunning ? (
                        <Tooltip title="Start Tutorial">
                            <IconButton 
                                onClick={handleStart}
                                className="tutorial-control-btn start"
                                size="large"
                            >
                                <PlayArrowIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <>
                            <Tooltip title={isPaused ? "Resume" : "Pause"}>
                                <IconButton 
                                    onClick={handlePause}
                                    className="tutorial-control-btn pause"
                                    size="large"
                                >
                                    {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Skip Tutorial">
                                <IconButton 
                                    onClick={handleSkip}
                                    className="tutorial-control-btn skip"
                                    size="large"
                                >
                                    <SkipNextIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    
                    <Tooltip title="Close Tutorial">
                        <IconButton 
                            onClick={handleClose}
                            className="tutorial-control-btn close"
                            size="large"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>



            {/* Joyride Component */}
            <Joyride
                steps={steps}
                run={run && isRunning && !isPaused}
                continuous={true}
                showProgress={false}
                showSkipButton={false}
                showCloseButton={false}
                disableOverlayClose={true}
                disableScrolling={false}
                scrollToFirstStep={true}
                spotlightClicks={true}

                onStepChange={handleStepChange}
                onComplete={handleComplete}
                styles={{
                    options: {
                        primaryColor: '#1976d2',
                        backgroundColor: '#ffffff',
                        textColor: '#333333',
                        arrowColor: '#ffffff',
                        overlayColor: 'rgba(0, 0, 0, 0.5)',
                        spotlightPadding: 8,
                        zIndex: 10000,
                    },
                    tooltip: {
                        borderRadius: 8,
                        fontSize: '14px',
                        maxWidth: 400,
                    },
                    buttonNext: {
                        backgroundColor: '#1976d2',
                        borderRadius: 6,
                        fontSize: '14px',
                        padding: '8px 16px',
                    },
                    buttonBack: {
                        color: '#1976d2',
                        fontSize: '14px',
                        padding: '8px 16px',
                    },
                    buttonSkip: {
                        color: '#666666',
                        fontSize: '14px',
                        padding: '8px 16px',
                    },
                }}
            />
        </div>
    );
};

export default TutorialOverlay; 