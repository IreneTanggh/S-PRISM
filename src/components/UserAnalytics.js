import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { logger } from '../utils/logger';

const UserAnalytics = ({ userId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [filterLevel, setFilterLevel] = useState('');
    const [filterComponent, setFilterComponent] = useState('');

    const fetchAnalytics = async () => {
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            
            const response = await fetch(`http://localhost:3001/api/analytics/${userId}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch analytics');
            
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            setError(error.message);
            logger.error('ANALYTICS', 'fetch_error', { error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            
            if (filterLevel) params.append('level', filterLevel);
            if (filterComponent) params.append('component', filterComponent);
            
            const response = await fetch(`http://localhost:3001/api/logs/${userId}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch logs');
            
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            setError(error.message);
            logger.error('ANALYTICS', 'fetch_logs_error', { error: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchLogs();
    }, [userId, startDate, endDate, filterLevel, filterComponent]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'error';
            case 'WARN': return 'warning';
            case 'INFO': return 'info';
            default: return 'default';
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    if (!userId) {
        return (
            <Box p={3}>
                <Alert severity="info">Please log in to view analytics</Alert>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box p={3}>
                <Typography variant="h4" gutterBottom>
                    User Analytics Dashboard
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Date Range and Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </Grid>
                        <Grid item>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </Grid>
                        <Grid item>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Level</InputLabel>
                                <Select
                                    value={filterLevel}
                                    label="Level"
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="INFO">Info</MenuItem>
                                    <MenuItem value="WARN">Warning</MenuItem>
                                    <MenuItem value="ERROR">Error</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Component</InputLabel>
                                <Select
                                    value={filterComponent}
                                    label="Component"
                                    onChange={(e) => setFilterComponent(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="USER_ACTION">User Actions</MenuItem>
                                    <MenuItem value="REPORT_GENERATION">Report Generation</MenuItem>
                                    <MenuItem value="SEARCH">Search</MenuItem>
                                    <MenuItem value="DOCUMENT_INTERACTION">Document Interaction</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item>
                            <Button 
                                variant="contained" 
                                onClick={() => { fetchAnalytics(); fetchLogs(); }}
                                disabled={loading}
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Analytics Summary */}
                {analytics && (
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Sessions
                                    </Typography>
                                    <Typography variant="h4">
                                        {analytics.totalSessions}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Active Sessions
                                    </Typography>
                                    <Typography variant="h4">
                                        {analytics.activeSessions}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Activities
                                    </Typography>
                                    <Typography variant="h4">
                                        {analytics.activitySummary?.reduce((sum, item) => sum + item.count, 0) || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Days Active
                                    </Typography>
                                    <Typography variant="h4">
                                        {analytics.dailyActivity?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Activity Summary */}
                {analytics?.activitySummary && (
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Activity Summary
                        </Typography>
                        <Grid container spacing={2}>
                            {analytics.activitySummary.map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Chip
                                        label={`${item._id.component}: ${item._id.action} (${item.count})`}
                                        variant="outlined"
                                        color="primary"
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Logs Table */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Activity Logs
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Level</TableCell>
                                    <TableCell>Component</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.level}
                                                color={getLevelColor(log.level)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{log.component}</TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap>
                                                {JSON.stringify(log.details).substring(0, 50)}...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
};

export default UserAnalytics; 