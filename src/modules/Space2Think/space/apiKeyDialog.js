import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    IconButton,
    Box,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function ApiKeyDialog({ open, onClose, error: apiError, onApiKeySaved }) {
    const [apiKey, setApiKey] = useState('');
    const [validationError, setValidationError] = useState('');
    const [hasValidKeySaved, setHasValidKeySaved] = useState(false);

    // Check if there's a valid API key stored
    const checkValidApiKey = () => {
        const storedKey = localStorage.getItem('openai_key_risky_but_cool');
        const inputKey = document.getElementById('openai_key_risky_but_cool')?.value;
        const key = storedKey || inputKey || '';
        return key.trim() !== '' && key.startsWith('sk-') && key.length >= 20;
    };

    // Check for valid API key when dialog opens
    useEffect(() => {
        if (open) {
            setHasValidKeySaved(checkValidApiKey());
            if (apiError) {
                setApiKey('');
            }
        }
    }, [open, apiError]);

    const validateApiKey = (key) => {
        if (!key) {
            return 'API key is required';
        }
        if (!key.startsWith('sk-')) {
            return 'API key must start with "sk-"';
        }
        // Remove the strict length check and just verify it's a reasonable length
        if (key.length < 20) {
            return 'API key seems too short. Please check your key.';
        }
        return '';
    };

    const handleSave = () => {
        const error = validateApiKey(apiKey);
        if (error) {
            setValidationError(error);
            return;
        }
        // Save to localStorage
        localStorage.setItem('openai_key_risky_but_cool', apiKey);
        // Also update the hidden input for legacy code
        let input = document.getElementById('openai_key_risky_but_cool');
        if (!input) {
            input = document.createElement('input');
            input.id = 'openai_key_risky_but_cool';
            input.type = 'hidden';
            document.body.appendChild(input);
        }
        input.value = apiKey;
        setValidationError('');
        setHasValidKeySaved(true); // Mark that a valid key has been saved
        if (onApiKeySaved) onApiKeySaved(apiKey);
        onClose(); // Only close if valid
    };

    const handleKeyChange = (e) => {
        const newKey = e.target.value.trim(); // Trim whitespace
        setApiKey(newKey);
        if (validationError) {
            setValidationError('');
        }
    };

    // Display either API error or validation error
    const displayError = apiError || validationError;
    
    // Check if we can close the dialog (only if there's a valid API key saved)
    const canClose = hasValidKeySaved;
    const handleClose = () => {
        if (canClose) {
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => {}}
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Enter OpenAI API Key</Typography>
                    {canClose && (
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Please enter your OpenAI API key to enable the report generation feature. 
                    Your key will be stored locally and used only for this application.
                </Typography>
                <Typography variant="body2" color="red" sx={{ mb: 2, fontStyle: 'italic' }}>
                    We will not save your API key on our servers.
                </Typography>
                {displayError && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 2 }}
                        variant="outlined"
                    >
                        {displayError}
                    </Alert>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label="API Key"
                    // type="password"
                    fullWidth
                    variant="outlined"
                    value={apiKey}
                    onChange={handleKeyChange}
                    placeholder="sk-..."
                    error={!!displayError}
                    helperText="Your OpenAI API key starts with 'sk-'"
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Don't have an API key? Get one from{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                        OpenAI's platform
                    </a>
                </Typography>
            </DialogContent>
            <DialogActions>
                {/* <Button onClick={onClose}>Cancel</Button> */}
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    color="primary"
                    disabled={!apiKey}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
} 