import { current } from '../modules/LexicalEditor/time';

class Logger {
    constructor() {
        this.userId = null;
        this.sessionId = null;
        this.taskId = null;
        this.logEndpoint = process.env.REACT_APP_LOG_ENDPOINT || 'http://localhost:3001/api/logs';
    }

    setUserContext(userId, sessionId, taskId) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.taskId = taskId;
    }

    async log(level, component, action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            timeFormatted: current(),
            level,
            component,
            action,
            userId: this.userId,
            sessionId: this.sessionId,
            taskId: this.taskId,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Console logging (existing behavior)
        console.log(`[${logEntry.timeFormatted}] [${component}] ${action}`, details);

        // Send to backend if user is authenticated
        if (this.userId) {
            try {
                await fetch(this.logEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(logEntry)
                });
            } catch (error) {
                console.error('Failed to send log to backend:', error);
            }
        }
    }

    info(component, action, details) {
        return this.log('INFO', component, action, details);
    }

    warn(component, action, details) {
        return this.log('WARN', component, action, details);
    }

    error(component, action, details) {
        return this.log('ERROR', component, action, details);
    }

    // Specific logging methods for common actions
    async logUserAction(action, details) {
        return this.info('USER_ACTION', action, details);
    }

    async logReportGeneration(snapshot, taskDescription) {
        return this.info('REPORT_GENERATION', 'generate_report', {
            snapshotSize: JSON.stringify(snapshot).length,
            taskDescription,
            hasFrames: this.hasFrames(snapshot)
        });
    }

    async logDocumentInteraction(action, documentId, details) {
        return this.info('DOCUMENT_INTERACTION', action, {
            documentId,
            ...details
        });
    }

    async logSearchQuery(query, results) {
        return this.info('SEARCH', 'search_query', {
            query,
            resultCount: results.length
        });
    }

    hasFrames(snapshot) {
        if (!snapshot || !snapshot.store) return false;
        return Object.values(snapshot.store).some(item => item.type === 'frame');
    }
}

export const logger = new Logger();
export default logger; 