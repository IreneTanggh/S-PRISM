/**
 * Utility functions for comparing task descriptions and report structures
 */

/**
 * Compare two task descriptions and return detailed differences
 * @param {string} currentTaskDescription - Current task description
 * @param {string} previousTaskDescription - Previous task description
 * @returns {Object} Object containing comparison results
 */
export function compareTaskDescriptions(currentTaskDescription: string, previousTaskDescription: string) {
    const result: {
        hasChanges: boolean;
        changes: {
            added: string;
            removed: string;
            modified: boolean;
        };
        similarity: number;
        details: {
            currentLength: number;
            previousLength: number;
            lengthDifference: number;
        };
    } = {
        hasChanges: false,
        changes: {
            added: '',
            removed: '',
            modified: false
        },
        similarity: 0,
        details: {
            currentLength: currentTaskDescription.length,
            previousLength: previousTaskDescription.length,
            lengthDifference: 0
        }
    };

    // Check if descriptions are identical
    if (currentTaskDescription === previousTaskDescription) {
        result.similarity = 1.0;
        return result;
    }

    result.hasChanges = true;
    result.details.lengthDifference = currentTaskDescription.length - previousTaskDescription.length;

    // Calculate similarity using simple character-based comparison
    const longer = currentTaskDescription.length > previousTaskDescription.length ? currentTaskDescription : previousTaskDescription;
    const shorter = currentTaskDescription.length > previousTaskDescription.length ? previousTaskDescription : currentTaskDescription;
    
    let commonChars = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (currentTaskDescription[i] === previousTaskDescription[i]) {
            commonChars++;
        }
    }
    
    result.similarity = commonChars / longer.length;

    // Determine what changed
    if (currentTaskDescription.length > previousTaskDescription.length) {
        // Current is longer - something was added
        const addedPart = currentTaskDescription.substring(previousTaskDescription.length);
        result.changes.added = addedPart;
    } else if (previousTaskDescription.length > currentTaskDescription.length) {
        // Previous was longer - something was removed
        const removedPart = previousTaskDescription.substring(currentTaskDescription.length);
        result.changes.removed = removedPart;
    } else {
        // Same length but different content - modified
        result.changes.modified = true;
    }

    return result;
}

/**
 * Compare two report structures and return detailed differences
 * @param {Array<{id: string, label: string, value: string}> | null} currentReportStructure - Current report structure
 * @param {Array<{id: string, label: string, value: string}> | null} previousReportStructure - Previous report structure
 * @returns {Object} Object containing comparison results
 */
export function compareReportStructures(
    currentReportStructure: Array<{id: string, label: string, value: string}> | null,
    previousReportStructure: Array<{id: string, label: string, value: string}> | null
) {
    const result: {
        hasChanges: boolean;
        changes: {
            added: Array<{id: string, label: string, value: string}>;
            removed: Array<{id: string, label: string, value: string}>;
            modified: Array<{
                id: string;
                previous: {id: string, label: string, value: string};
                current: {id: string, label: string, value: string};
            }>;
            reordered: boolean;
        };
        details: {
            currentSections: number;
            previousSections: number;
            sectionDifference: number;
        };
    } = {
        hasChanges: false,
        changes: {
            added: [],
            removed: [],
            modified: [],
            reordered: false
        },
        details: {
            currentSections: 0,
            previousSections: 0,
            sectionDifference: 0
        }
    };

    // Handle null cases
    if (!currentReportStructure && !previousReportStructure) {
        return result;
    }

    if (!currentReportStructure) {
        result.hasChanges = true;
        result.changes.removed = previousReportStructure || [];
        result.details.previousSections = previousReportStructure?.length || 0;
        return result;
    }

    if (!previousReportStructure) {
        result.hasChanges = true;
        result.changes.added = currentReportStructure;
        result.details.currentSections = currentReportStructure.length;
        return result;
    }

    result.details.currentSections = currentReportStructure.length;
    result.details.previousSections = previousReportStructure.length;
    result.details.sectionDifference = currentReportStructure.length - previousReportStructure.length;

    // Create maps for easier comparison
    const currentMap = new Map(currentReportStructure.map(section => [section.id, section]));
    const previousMap = new Map(previousReportStructure.map(section => [section.id, section]));

    // Find added sections
    for (const [id, section] of currentMap) {
        if (!previousMap.has(id)) {
            result.changes.added.push(section);
        }
    }

    // Find removed sections
    for (const [id, section] of previousMap) {
        if (!currentMap.has(id)) {
            result.changes.removed.push(section);
        }
    }

    // Find modified sections
    for (const [id, currentSection] of currentMap) {
        const previousSection = previousMap.get(id);
        if (previousSection && (
            currentSection.label !== previousSection.label ||
            currentSection.value !== previousSection.value
        )) {
            result.changes.modified.push({
                id,
                previous: previousSection,
                current: currentSection
            });
        }
    }

    // Check for reordering (if sections are the same but in different order)
    if (result.changes.added.length === 0 && result.changes.removed.length === 0 && result.changes.modified.length === 0) {
        // Check if order changed
        for (let i = 0; i < Math.min(currentReportStructure.length, previousReportStructure.length); i++) {
            if (currentReportStructure[i].id !== previousReportStructure[i].id) {
                result.changes.reordered = true;
                break;
            }
        }
    }

    // Determine if there are any changes
    result.hasChanges = result.changes.added.length > 0 || 
                       result.changes.removed.length > 0 || 
                       result.changes.modified.length > 0 || 
                       result.changes.reordered;

    return result;
}

/**
 * Comprehensive comparison function that combines task description and report structure comparisons
 * @param {string} currentTaskDescription - Current task description
 * @param {string} previousTaskDescription - Previous task description
 * @param {Array<{id: string, label: string, value: string}> | null} currentReportStructure - Current report structure
 * @param {Array<{id: string, label: string, value: string}> | null} previousReportStructure - Previous report structure
 * @returns {Object} Object containing all comparison results
 */
export function compareTaskAndReportStructure(
    currentTaskDescription: string,
    previousTaskDescription: string,
    currentReportStructure: Array<{id: string, label: string, value: string}> | null,
    previousReportStructure: Array<{id: string, label: string, value: string}> | null
) {
    const taskComparison = compareTaskDescriptions(currentTaskDescription, previousTaskDescription);
    const reportComparison = compareReportStructures(currentReportStructure, previousReportStructure);

    return {
        hasAnyChanges: taskComparison.hasChanges || reportComparison.hasChanges,
        taskDescription: taskComparison,
        reportStructure: reportComparison,
        summary: {
            taskDescriptionChanged: taskComparison.hasChanges,
            reportStructureChanged: reportComparison.hasChanges,
            totalChanges: (taskComparison.hasChanges ? 1 : 0) + (reportComparison.hasChanges ? 1 : 0)
        }
    };
}

/**
 * Type definitions for the comparison results
 */
export interface TaskDescriptionComparison {
    hasChanges: boolean;
    changes: {
        added: string;
        removed: string;
        modified: boolean;
    };
    similarity: number;
    details: {
        currentLength: number;
        previousLength: number;
        lengthDifference: number;
    };
}

export interface ReportStructureComparison {
    hasChanges: boolean;
    changes: {
        added: Array<{id: string, label: string, value: string}>;
        removed: Array<{id: string, label: string, value: string}>;
        modified: Array<{
            id: string;
            previous: {id: string, label: string, value: string};
            current: {id: string, label: string, value: string};
        }>;
        reordered: boolean;
    };
    details: {
        currentSections: number;
        previousSections: number;
        sectionDifference: number;
    };
}

export interface ComprehensiveComparison {
    hasAnyChanges: boolean;
    taskDescription: TaskDescriptionComparison;
    reportStructure: ReportStructureComparison;
    summary: {
        taskDescriptionChanged: boolean;
        reportStructureChanged: boolean;
        totalChanges: number;
    };
} 