# Task Description and Report Structure Comparison Functions

This module provides utility functions for comparing task descriptions and report structures to detect changes and provide detailed analysis of differences.

## Functions

### `compareTaskDescriptions(currentTaskDescription, previousTaskDescription)`

Compares two task description strings and returns detailed information about their differences.

**Parameters:**
- `currentTaskDescription` (string): The current task description
- `previousTaskDescription` (string): The previous task description

**Returns:**
```typescript
{
  hasChanges: boolean;
  changes: {
    added: string;
    removed: string;
    modified: boolean;
  };
  similarity: number; // 0.0 to 1.0, where 1.0 means identical
  details: {
    currentLength: number;
    previousLength: number;
    lengthDifference: number;
  };
}
```

**Example:**
```typescript
import { compareTaskDescriptions } from './comparisonUtils';

const current = "Analyze the terrorist threat and predict when and where it will occur.";
const previous = "Analyze the terrorist threat.";

const result = compareTaskDescriptions(current, previous);
console.log(result.hasChanges); // true
console.log(result.similarity); // 0.7 (approximately)
console.log(result.changes.added); // " and predict when and where it will occur."
```

### `compareReportStructures(currentReportStructure, previousReportStructure)`

Compares two report structure arrays and returns detailed information about their differences.

**Parameters:**
- `currentReportStructure` (Array<{id: string, label: string, value: string}> | null): The current report structure
- `previousReportStructure` (Array<{id: string, label: string, value: string}> | null): The previous report structure

**Returns:**
```typescript
{
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
```

**Example:**
```typescript
import { compareReportStructures } from './comparisonUtils';

const current = [
  { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
  { id: 'clusterDescription', label: 'Cluster Analysis', value: 'Analyze each cluster' },
  { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' },
  { id: 'recommendations', label: 'Recommendations', value: 'Provide recommendations' }
];

const previous = [
  { id: 'introduction', label: 'Introduction', value: 'Summarize findings' },
  { id: 'clusterDescription', label: 'Cluster Analysis', value: 'Analyze each cluster' },
  { id: 'conclusion', label: 'Conclusion', value: 'Draw conclusions' }
];

const result = compareReportStructures(current, previous);
console.log(result.hasChanges); // true
console.log(result.changes.added.length); // 1
console.log(result.changes.added[0].id); // 'recommendations'
```

### `compareTaskAndReportStructure(currentTaskDescription, previousTaskDescription, currentReportStructure, previousReportStructure)`

Performs a comprehensive comparison of both task descriptions and report structures in a single function call.

**Parameters:**
- `currentTaskDescription` (string): The current task description
- `previousTaskDescription` (string): The previous task description
- `currentReportStructure` (Array<{id: string, label: string, value: string}> | null): The current report structure
- `previousReportStructure` (Array<{id: string, label: string, value: string}> | null): The previous report structure

**Returns:**
```typescript
{
  hasAnyChanges: boolean;
  taskDescription: TaskDescriptionComparison;
  reportStructure: ReportStructureComparison;
  summary: {
    taskDescriptionChanged: boolean;
    reportStructureChanged: boolean;
    totalChanges: number;
  };
}
```

**Example:**
```typescript
import { compareTaskAndReportStructure } from './comparisonUtils';

const result = compareTaskAndReportStructure(
  currentTask,
  previousTask,
  currentStructure,
  previousStructure
);

console.log(result.hasAnyChanges); // true
console.log(result.summary.totalChanges); // 2
console.log(result.summary.taskDescriptionChanged); // true
console.log(result.summary.reportStructureChanged); // true
```

## Type Definitions

The module also exports TypeScript interfaces for the return types:

- `TaskDescriptionComparison`
- `ReportStructureComparison`
- `ComprehensiveComparison`

## Usage in ReportRefinement

These functions are integrated into the `reportRefinement` function to detect when task descriptions or report structures have changed, which may trigger report regeneration.

```typescript
// In reportRefinement function
const taskDescriptionComparison = compareTaskDescriptions(taskDescription || '', previousTaskDescription || '');
const reportStructureComparison = compareReportStructures(reportStructure, previousReportStructure);
const hasTaskDescriptionChanges = taskDescriptionComparison.hasChanges;
const hasReportStructureChanges = reportStructureComparison.hasChanges;

// Early return if no changes detected
if (!hasStructureChanges && !hasInteractionChanges && !hasReportStructureChanges && !hasTaskDescriptionChanges && !hasRefineSettingsChanges) {
  return previousReport;
}
```

## Examples

See `comparisonExample.ts` for comprehensive examples of how to use these functions in various scenarios:

1. Task description comparison
2. Report structure comparison
3. Comprehensive comparison
4. No changes scenario
5. Modified content scenario

Run the examples with:
```typescript
import { runAllExamples } from './comparisonExample';
runAllExamples();
```

## Algorithm Details

### Task Description Comparison
- Uses character-by-character comparison for similarity calculation
- Detects additions, removals, and modifications
- Provides similarity score from 0.0 to 1.0

### Report Structure Comparison
- Compares sections by ID, label, and value
- Detects added, removed, modified, and reordered sections
- Handles null/undefined cases gracefully
- Uses Map for efficient lookups

### Performance
- Time complexity: O(n) for task descriptions, O(n) for report structures
- Space complexity: O(n) for both comparisons
- Optimized for typical use cases with small to medium-sized structures 