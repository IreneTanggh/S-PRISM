/**
 * Example usage of the comparison functions
 */

import { 
    compareTaskDescriptions, 
    compareReportStructures, 
    compareTaskAndReportStructure 
} from './comparisonUtils';

// Example 1: Compare task descriptions
export function exampleTaskDescriptionComparison() {
    const currentTask = "Analyze the terrorist threat and predict when and where it will occur.";
    const previousTask = "Analyze the terrorist threat.";
    
    const result = compareTaskDescriptions(currentTask, previousTask);
    
    console.log("Task Description Comparison:");
    console.log("Has changes:", result.hasChanges);
    console.log("Similarity:", result.similarity);
    console.log("Changes:", result.changes);
    console.log("Details:", result.details);
    
    return result;
}

// Example 2: Compare report structures
export function exampleReportStructureComparison() {
    const currentStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Analysis', value: 'Analyze each cluster' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' },
        { id: 'recommendations', label: 'Recommendations', value: 'Provide recommendations' }
    ];
    
    const previousStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Analysis', value: 'Analyze each cluster' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' }
    ];
    
    const result = compareReportStructures(currentStructure, previousStructure);
    
    console.log("Report Structure Comparison:");
    console.log("Has changes:", result.hasChanges);
    console.log("Changes:", result.changes);
    console.log("Details:", result.details);
    
    return result;
}

// Example 3: Comprehensive comparison
export function exampleComprehensiveComparison() {
    const currentTask = "Analyze the terrorist threat and predict when and where it will occur.";
    const previousTask = "Analyze the terrorist threat.";
    
    const currentStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Description', value: 'Analyze each cluster' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' }
    ];
    
    const previousStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Description', value: 'Analyze each cluster' }
    ];
    
    const result = compareTaskAndReportStructure(
        currentTask, 
        previousTask, 
        currentStructure, 
        previousStructure
    );
    
    console.log("Comprehensive Comparison:");
    console.log("Has any changes:", result.hasAnyChanges);
    console.log("Summary:", result.summary);
    console.log("Task description changes:", result.taskDescription);
    console.log("Report structure changes:", result.reportStructure);
    
    return result;
}

// Example 4: No changes scenario
export function exampleNoChanges() {
    const task = "Analyze the terrorist threat.";
    const structure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Description', value: 'Analyze each cluster' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' }
    ];
    
    const result = compareTaskAndReportStructure(task, task, structure, structure);
    
    console.log("No Changes Example:");
    console.log("Has any changes:", result.hasAnyChanges);
    console.log("Summary:", result.summary);
    
    return result;
}

// Example 5: Modified content scenario
export function exampleModifiedContent() {
    const currentTask = "Analyze the terrorist threat and predict when and where it will occur.";
    const previousTask = "Analyze the terrorist threat and predict the target location.";
    
    const currentStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings in BLUF format' },
        { id: 'clusterDescription', label: 'Cluster Description', value: 'Analyze each cluster in detail' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions and inferences' }
    ];
    
    const previousStructure = [
        { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
        { id: 'clusterDescription', label: 'Cluster Description', value: 'Analyze each cluster' },
        { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' }
    ];
    
    const result = compareTaskAndReportStructure(
        currentTask, 
        previousTask, 
        currentStructure, 
        previousStructure
    );
    
    console.log("Modified Content Example:");
    console.log("Has any changes:", result.hasAnyChanges);
    console.log("Summary:", result.summary);
    console.log("Task description similarity:", result.taskDescription.similarity);
    console.log("Modified sections:", result.reportStructure.changes.modified);
    
    return result;
}

// Run all examples
export function runAllExamples() {
    console.log("=== Running All Comparison Examples ===\n");
    
    console.log("1. Task Description Comparison:");
    exampleTaskDescriptionComparison();
    console.log("\n");
    
    console.log("2. Report Structure Comparison:");
    exampleReportStructureComparison();
    console.log("\n");
    
    console.log("3. Comprehensive Comparison:");
    exampleComprehensiveComparison();
    console.log("\n");
    
    console.log("4. No Changes Example:");
    exampleNoChanges();
    console.log("\n");
    
    console.log("5. Modified Content Example:");
    exampleModifiedContent();
    console.log("\n");
    
    console.log("=== All Examples Completed ===");
} 