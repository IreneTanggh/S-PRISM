import yellowstoneCluster from '../dataset/yellowstone_cluster_2.json';
import {
    setReport,
    setPreReport,
    clearReportHistory,
    setModifiedGeneration,
} from '../../LexicalEditor/slices/EditorSlice.js';
import {
    setTaskDescription,
    setReportStructure,
    setDefaultTaskDescription,
    setDefaultReportStructure,
} from '../../LexicalEditor/slices/SpaceSlice.js';

/** Same report task config as Open → yellowstone in Space2Think.js */
const YELLOWSTONE_TASK_DESCRIPTION = '';
const YELLOWSTONE_REPORT_STRUCTURE = [
    { id: 'introduction', label: 'Introduction', value: `Provide a "Bottom Line Up Front" (BLUF) executive summary in one paragraph. Answer: "What should a first-time visitor to Yellowstone know?" Synthesize the most critical findings about planning, safety, attractions, and logistics into actionable takeaways.` },
    { id: 'clusterDescription', label: 'Cluster Analysis', value: `For each major topic (attractions, logistics, safety, etc.), provide: 1) One-sentence overview, 2) Detailed analysis covering What (key features/activities), Where (specific locations), When (best timing/seasons), and Who (target visitor types).`},
    { id: 'subClusterDescription', label: 'Sub-Cluster Analysis', value: `Analyze subtopics within each main category. Highlight specific relationships, practical considerations, and insider insights that enhance the visitor experience.`},
    { id: 'conclusion', label: 'Conclusion', value: `Synthesize how different aspects of Yellowstone connect to create an optimal visit strategy. Focus on: 1) How timing, location choices, and activities interconnect, 2) Key decision points for first-time visitors, 3) Potential challenges and how to mitigate them.` },
];

// Tutorial state management
export class TutorialDataManager {
    constructor() {
        this.tutorialState = {
            isActive: false,
            currentStep: 0,
            isCompleted: false,
            startTime: null,
            completionTime: null,
            totalSteps: 0,
            visitedSteps: new Set(),
            userInteractions: [],
            datasetLoaded: false
        };
        
        this.yellowstoneData = {
            /** Full canvas state lives in yellowstone_cluster.json; load via editor.store.loadSnapshot */
            dataset: 'yellowstone_cluster',
            description: "Yellowstone National Park is America's first national park, established in 1872. It spans across Wyoming, Montana, and Idaho, featuring dramatic canyons, alpine rivers, lush forests, hot springs, and gushing geysers.",
            keyTopics: [
                "Geothermal Features",
                "Wildlife and Ecosystems", 
                "Geological History",
                "Visitor Attractions",
                "Conservation Efforts"
            ],
            sampleSearches: [
                "Old Faithful",
                "geysers",
                "wildlife",
                "geothermal",
                "Yellowstone Lake",
                "Grand Canyon of Yellowstone"
            ]
        };
    }

    // Initialize tutorial with Yellowstone data
    initializeTutorial(editor, dispatch) {
        if (!editor) return false;

        try {
            editor.selectAll();
            editor.deleteShapes(editor.getSelectedShapeIds());
            editor.selectNone();

            if (dispatch) {
                dispatch(setReport(''));
                dispatch(setPreReport(''));
                dispatch(clearReportHistory());
                dispatch(setModifiedGeneration(false));
                dispatch(setTaskDescription(YELLOWSTONE_TASK_DESCRIPTION));
                dispatch(setReportStructure(YELLOWSTONE_REPORT_STRUCTURE));
                dispatch(setDefaultTaskDescription(YELLOWSTONE_TASK_DESCRIPTION));
                dispatch(setDefaultReportStructure(YELLOWSTONE_REPORT_STRUCTURE));
            }

            editor.store.loadSnapshot(yellowstoneCluster);
            editor.updateInstanceState({ isFocused: true });
            editor.zoomToFit({ duration: 500, padding: 100 });
            
            // Reset tutorial state
            this.tutorialState = {
                ...this.tutorialState,
                isActive: true,
                currentStep: 0,
                startTime: new Date(),
                totalSteps: 0,
                visitedSteps: new Set(),
                userInteractions: [],
                datasetLoaded: true
            };

            return true;
        } catch (error) {
            console.error('Failed to initialize tutorial:', error);
            return false;
        }
    }

    // Track user interaction
    trackInteraction(stepIndex, action, details = {}) {
        this.tutorialState.userInteractions.push({
            stepIndex,
            action,
            timestamp: new Date(),
            details
        });
    }

    // Mark step as visited
    markStepVisited(stepIndex) {
        this.tutorialState.visitedSteps.add(stepIndex);
        this.tutorialState.currentStep = stepIndex;
    }

    // Complete tutorial
    completeTutorial() {
        this.tutorialState.isCompleted = true;
        this.tutorialState.completionTime = new Date();
        this.tutorialState.isActive = false;
        
        // Calculate completion time
        if (this.tutorialState.startTime) {
            const duration = this.tutorialState.completionTime - this.tutorialState.startTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            console.log(`Tutorial completed in ${minutes}m ${seconds}s`);
        }
    }

    // Get tutorial progress
    getProgress() {
        const totalSteps = this.tutorialState.totalSteps;
        const visitedSteps = this.tutorialState.visitedSteps.size;
        
        return {
            currentStep: this.tutorialState.currentStep,
            totalSteps,
            visitedSteps,
            progressPercentage: totalSteps > 0 ? (visitedSteps / totalSteps) * 100 : 0,
            isCompleted: this.tutorialState.isCompleted,
            estimatedTimeRemaining: this.estimateTimeRemaining()
        };
    }

    // Estimate time remaining
    estimateTimeRemaining() {
        if (this.tutorialState.userInteractions.length < 2) return null;
        
        const interactions = this.tutorialState.userInteractions;
        const totalTime = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
        const averageTimePerStep = totalTime / interactions.length;
        
        const remainingSteps = this.tutorialState.totalSteps - this.tutorialState.currentStep;
        return remainingSteps * averageTimePerStep;
    }

    // Get Yellowstone-specific content
    getYellowstoneContent() {
        return {
            ...this.yellowstoneData,
            quickStart: {
                title: "Quick Start with Yellowstone",
                steps: [
                    "Explore the main workspace to see Yellowstone information clusters",
                    "Click on documents to highlight related information",
                    "Use search to find specific topics like 'geysers' or 'wildlife'",
                    "Generate a comprehensive report about the park",
                    "Customize your analysis focus in the settings"
                ]
            },
            sampleTasks: [
                {
                    title: "Geological Features Analysis",
                    description: "Focus on geothermal features, geysers, and geological history",
                    keywords: ["geysers", "hot springs", "geothermal", "volcanic", "geology"]
                },
                {
                    title: "Wildlife and Ecosystem Study",
                    description: "Analyze the park's diverse wildlife and natural ecosystems",
                    keywords: ["wildlife", "ecosystem", "biodiversity", "animals", "habitat"]
                },
                {
                    title: "Visitor Experience Guide",
                    description: "Create a guide focusing on attractions and visitor information",
                    keywords: ["attractions", "visitor", "tourism", "activities", "facilities"]
                }
            ]
        };
    }

    // Reset tutorial
    resetTutorial() {
        this.tutorialState = {
            isActive: false,
            currentStep: 0,
            isCompleted: false,
            startTime: null,
            completionTime: null,
            totalSteps: 0,
            visitedSteps: new Set(),
            userInteractions: [],
            datasetLoaded: false
        };
    }

    // Export tutorial data for analytics
    exportTutorialData() {
        return {
            ...this.tutorialState,
            yellowstoneData: this.yellowstoneData,
            analytics: {
                totalSteps: this.tutorialState.totalSteps,
                visitedSteps: this.tutorialState.visitedSteps.size,
                completionRate: this.tutorialState.isCompleted ? 100 : 
                    (this.tutorialState.visitedSteps.size / this.tutorialState.totalSteps) * 100,
                averageTimePerStep: this.calculateAverageTimePerStep(),
                userEngagement: this.calculateUserEngagement()
            }
        };
    }

    // Calculate average time per step
    calculateAverageTimePerStep() {
        if (this.tutorialState.userInteractions.length < 2) return 0;
        
        const interactions = this.tutorialState.userInteractions;
        const totalTime = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
        return totalTime / interactions.length;
    }

    // Calculate user engagement score
    calculateUserEngagement() {
        const totalInteractions = this.tutorialState.userInteractions.length;
        const uniqueSteps = this.tutorialState.visitedSteps.size;
        const completionBonus = this.tutorialState.isCompleted ? 20 : 0;
        
        // Base score from interactions and step coverage
        const baseScore = Math.min((totalInteractions / 10) * 30 + (uniqueSteps / 20) * 50, 80);
        
        return Math.min(baseScore + completionBonus, 100);
    }
}

// Create singleton instance
export const tutorialDataManager = new TutorialDataManager();

// Export default instance
export default tutorialDataManager; 