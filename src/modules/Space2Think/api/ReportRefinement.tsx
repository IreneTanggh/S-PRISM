import {
	GPT4CompletionResponse,
	GPT4Message,
	MessageContent,
	fetchFromOpenAi,
} from './fetchFromOpenAi.tsx'
import { getOpenAIApiKey } from './getOpenAIApiKey.ts';

import { $getSelection } from 'lexical'; 
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { useEffect, Dispatch, useState} from 'react';
import {
    useDispatch,
    useSelector
} from 'react-redux';
import { setReport } from '../../LexicalEditor/slices/EditorSlice'
import { current } from '../../LexicalEditor/time.js';
import { space_comparison } from './dataProcess/spaceComparison.tsx';
import { setRefineReactMessage } from '../../LexicalEditor/slices/SpaceSlice.js';
import { compareTaskDescriptions, compareReportStructures, compareTaskAndReportStructure } from './comparisonUtils.ts';
import { logger } from '../../../utils/logger.js';


let systemPrompt1 = `
You are an expert in sensemaking. Your task is to reason why user changes the workspace after reading all the documents and give me a concise answer of how the facts in the previous report will change.

I will provide you with:
1. The previous workspace report
2. A detailed diff showing what has changed between the previous workspace and the current one
3. The current document structure and human visual marks in the workspace

These interactions convey different meanings:
1. Highlight: Keywords marked by the user to emphasize importance and guide your attention.
2. Annotation: The user's personal insights related to a specific document or cluster of information. Do not use it to change the cluster name.
3. Negative_highlight: Keywords marked as irrelevant by the user. Omit any terms added to negative_highlights from new reports. If a term is removed from highlights, you may include it in new reports only if you determine it holds significant value.

Your task:
- Reason why user changes the workspace and write prompts for guiding the report refinement. Provide specific, concrete details rather than abstract descriptions. DO NOT create new clusters for added hi.
`
// s- **CRITICAL: You must NEVER modify, rename, or suggest changes to existing cluster names. Always preserve the exact cluster names from the user's document structure.**


let systemPrompt1_promptChanges = `
You are an expert in sensemaking. Your task is to reason identify if and understand why user changes the task description and report structure after reading all the documents and give me a concise answer of how the facts in the previous report will change.
I will provide you with:
1. The task description and report structure changes

Your task:
- Identify the changes in the task description and report structure.
- Write prompts for guiding the report refinement based on the changes. 
`

let systemPrompt2 = `
    You are analyzing visual workspaces that contain clusters of information. I will provide you with:
    1. The previous workspace report
    2. A detailed diff showing what has changed between the previous workspace and the current one
    3. A report of human intention of the changes.

    Your task:
    - REVISE content from the previous report only to improve accuracy and conform to the new output format; do not rephrase.
    - ADD new sections ONLY for newly introduced clusters or elements and revise the introduction and conclusion of the report.
    - Format any new content to match the style of the existing report
    - TREAT this as a report that summarizes the workspace. DO NOT include the words such as "new clusters/new highlights reveal that..."
    - DO NOT include words like "cluster" or "document" in the report.
	  - DO NOT omit any cluster summaries. Even if one cluster includes all documents, summarize it as a standalone group.
`

let assistantPrompt1 = `The returned JSON objects should follow this format:
{
    "Reasoning": "Reason why user changes the workspace. DO NOT give abstract description.",
    "Command": "You should write prompts for guiding the report refinement in one paragraph. DO NOT give abstract command. Leave the command empty if you think the report does not need to be refined. If the cluster name is changed, you should change the cluster name in the report."
}
`

let assistantPrompt1_promptChanges = `
The returned JSON objects should follow this format:
{
    "Reasoning": "Identify the changes in the task description and report structure.",
    "Command": "Write a prompt for guiding the report refinement based on the changes in one sentence."
}
`

let assistantPrompt2_template = `The returned JSON objects must follow this format:
{
    <DYNAMIC_STRUCTURE>
}

Note you should use cluster and node id provided to you in the input JSON object. Remember there are clusters and possibly sub clusters. DO NOT create your own sub clusters.
`
// add "\n" after each prompt

//hard code ChatGPT API here, if you publicize the code, you need to remove it
// process.env.OPENAI_API_KEY="<Your OpenAI API Key Here>"
// still need text prompt and interaction prompt

// Add type for reportStructure
/**
 * @typedef {{ id: string, label: string, value: string }} ReportSection
 */

/**
 * @param {any} snapshot
 * @param {string} previousReport
 * @param {any} pre_snapshot
 * @param {ReportSection[] | null} reportStructure
 * @param {any} dispatch
 * @param {any} reportRefineSettings
 */
export async function reportRefinement (
  snapshot: any,
  previousReport: string,
  pre_snapshot: any,
  reportStructure: Array<{id: string, label: string, value: string}> | null = null,
  dispatch: any,
  reportRefineSettings: any,
  taskDescription: string,
  previousTaskDescription: string,
  previousReportStructure: Array<{id: string, label: string, value: string}> | null = null,
  previousReportRefineSettings: any,
) {
	const stringified = JSON.stringify(snapshot);
	const jsondata = JSON.parse(stringified);
	const data = jsondata.store;
    //previous report
    // const previousReport = previousReport;
    //workspace change

	const [doc_structure, doc_structure_diff, human_interation, human_interation_diff, hierarchicalStructure] = space_comparison(snapshot, pre_snapshot);
	console.log(`[${current()}]`+ "[ReportRefinement] doc_structure_diff", doc_structure_diff);
  console.log(`[${current()}]`+ "[ReportRefinement] human_interation", human_interation);
	console.log(`[${current()}]`+ "[ReportRefinement] human_interation_diff", human_interation_diff);

	// Verify if doc_structure_diff includes any changes
	const hasAddedClusters = doc_structure_diff?.["added_clusters"] && Array.isArray(doc_structure_diff["added_clusters"]) && doc_structure_diff["added_clusters"].length > 0;
	const hasRemovedClusters = doc_structure_diff?.["removed_clusters"] && Array.isArray(doc_structure_diff["removed_clusters"]) && doc_structure_diff["removed_clusters"].length > 0;
	
	// Check for modifications in clusters
	let hasMemberChanges = false;
	let hasNameChanges = false;
	let hasSubclusterChanges = false;
	let hasStructuralChanges = false;
	
	if (doc_structure_diff?.["cluster_changes"] && typeof doc_structure_diff["cluster_changes"] === 'object') {
		const modifiedClusters = doc_structure_diff["cluster_changes"];
		// Check if any cluster has member changes
		hasMemberChanges = Object.values(modifiedClusters).some((cluster: any) => 
			cluster?.member_changes && 
			(Array.isArray(cluster.member_changes.removed) && cluster.member_changes.removed.length > 0 || 
			 Array.isArray(cluster.member_changes.added) && cluster.member_changes.added.length > 0)
		);
		
		// Check if any cluster has name changes
		hasNameChanges = Object.values(modifiedClusters).some((cluster: any) => 
			cluster?.name_changes
		);
		
		// Check if any cluster has subcluster changes
		hasSubclusterChanges = Object.values(modifiedClusters).some((cluster: any) => 
			cluster?.subcluster_changes && 
			(Array.isArray(cluster.subcluster_changes.removed) && cluster.subcluster_changes.removed.length > 0 || 
			 Array.isArray(cluster.subcluster_changes.added) && cluster.subcluster_changes.added.length > 0 || 
			 Array.isArray(cluster.subcluster_changes.modified) && cluster.subcluster_changes.modified.length > 0)
		);
		
		// Check if any cluster has structural changes (hierarchy level changes)
		hasStructuralChanges = Object.values(modifiedClusters).some((cluster: any) => 
			cluster?.structural_changes
		);
		console.log(`[${current()}]`+ "[ReportRefinement] hasStructuralChanges", hasStructuralChanges);
	}
	
	const hasStructureChanges = hasAddedClusters || hasMemberChanges || hasNameChanges || hasRemovedClusters || hasSubclusterChanges || hasStructuralChanges;
	console.log(`[${current()}]`+ "[ReportRefinement] Structure changes detected:", {
		hasAddedClusters,
		hasMemberChanges,
		hasNameChanges,
		hasRemovedClusters,
		hasStructureChanges,
    hasSubclusterChanges,
    // hasStructuralChanges
	});

	// Verify if human_interaction_diff includes any changes
	const sections = ["highlights", "negative_highlights", "annotations"] as const;
	function sectionHasChanges(sectionDiff: any) {
		if (!sectionDiff || typeof sectionDiff !== 'object') return false;
		const added = sectionDiff.added && typeof sectionDiff.added === 'object' && Object.keys(sectionDiff.added).length > 0;
		const removed = sectionDiff.removed && typeof sectionDiff.removed === 'object' && Object.keys(sectionDiff.removed).length > 0;
		const modified = sectionDiff.modified && typeof sectionDiff.modified === 'object' && Object.keys(sectionDiff.modified).length > 0;
		return added || removed || modified;
	}
	const hasAddedInteractions = sections.some(s => human_interation_diff?.[s]?.added && typeof human_interation_diff[s].added === 'object' && Object.keys(human_interation_diff[s].added).length > 0);
	const hasModifiedInteractions = sections.some(s => human_interation_diff?.[s]?.modified && typeof human_interation_diff[s].modified === 'object' && Object.keys(human_interation_diff[s].modified).length > 0);
	const hasRemovedInteractions = sections.some(s => human_interation_diff?.[s]?.removed && typeof human_interation_diff[s].removed === 'object' && Object.keys(human_interation_diff[s].removed).length > 0);
	const hasInteractionChanges = sections.some(s => sectionHasChanges(human_interation_diff?.[s]));
	console.log(`[${current()}]`+ "[ReportRefinement] Interaction changes detected:", {
		hasAddedInteractions,
		hasModifiedInteractions,
		hasRemovedInteractions,
		hasInteractionChanges
	});



	// Use the new comparison functions
  console.log(`[${current()}]`+ "[ReportRefinement] taskDescription", taskDescription);
  console.log(`[${current()}]`+ "[ReportRefinement] previousTaskDescription", previousTaskDescription);
  console.log(`[${current()}]`+ "[ReportRefinement] reportStructure", reportStructure);
  console.log(`[${current()}]`+ "[ReportRefinement] previousReportStructure", previousReportStructure);
  console.log(`[${current()}]`+ "[ReportRefinement] reportRefineSettings", reportRefineSettings);
  console.log(`[${current()}]`+ "[ReportRefinement] previousReportRefineSettings", previousReportRefineSettings);
	const taskDescriptionComparison = compareTaskDescriptions(taskDescription || '', previousTaskDescription || '');
	const reportStructureComparison = compareReportStructures(reportStructure, previousReportStructure);
	const hasTaskDescriptionChanges = taskDescriptionComparison.hasChanges;
	const hasReportStructureChanges = reportStructureComparison.hasChanges;
	const hasRefineSettingsChanges = JSON.stringify(reportRefineSettings) !== JSON.stringify(previousReportRefineSettings);
	
	console.log(`[${current()}]`+ "[ReportRefinement] Prompt setting changes: Task description changes:", taskDescriptionComparison);
	console.log(`[${current()}]`+ "[ReportRefinement] Prompt setting changes: Report structure changes:", reportStructureComparison);
	console.log(`[${current()}]`+ "[ReportRefinement] Prompt setting changes: hasTaskDescriptionChanges", hasTaskDescriptionChanges);
	console.log(`[${current()}]`+ "[ReportRefinement] Prompt setting changes: hasReportStructureChanges", hasReportStructureChanges);
	console.log(`[${current()}]`+ "[ReportRefinement] Prompt setting changes: hasRefineSettingsChanges", hasRefineSettingsChanges);

	// Early return if no changes detected
	if (!hasStructureChanges && !hasInteractionChanges && !hasReportStructureChanges && !hasTaskDescriptionChanges && !hasRefineSettingsChanges) {
		console.log(`[${current()}]`+ "[ReportRefinement] No changes detected, returning previous report");
		return previousReport;
	}

		// Build dynamic structure if reportStructure is provided, otherwise use default structure
	let dynamicStructure = "";
  let assistantPrompt2 = "";
	if (Array.isArray(reportStructure)) {
    console.log(`[${current()}]`+ "[ReportRefinement] reportStructure", reportStructure)
		// Find subClusterDescription value first
		let subClusterDescriptionValue = "";
		reportStructure.forEach((section) => {
			if (section.id === 'subClusterDescription') {
				subClusterDescriptionValue = section.value;
			}
		});

		reportStructure.forEach((section, index) => {
			if (section.id === 'clusterDescription') {
				// Special handling for cluster description - it becomes the Middle_paragraph
				dynamicStructure += `    \"Middle_paragraph\": [
          {
              \"id\": \"use the original cluster id\",
              \"name\":\"If the cluster's original name is empty, must summarize the content as the new name. If not, DO NOT change and use the original name.\",
              \"text\": \"${section.value}. Must include citations in the text, like 'name [document1 label, document2 label]'.\",
              \"name entities\": \"list important entities in 'text' with document id as citation, like 'name[document_label1, document_label2]'.\",
              \"keywords\": \"list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 label, document2 label]'\",
              \"subclusters\": {
                  \"subcluster_id\": {
                      \"name\":\"If the subcluster's original name is empty, must summarize the content as the new name. If not, DO NOT change and use the original name.\",
                      \"text\": \"${subClusterDescriptionValue || section.value}. Must include citations in the text, like 'name [document1 label, document2 label]'.\",
                      \"name entities\": \"list important entities in 'text' with document id as citation, like 'name[document_label1, document_label2]'.\",
                      \"keywords\": \"list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 label, document2 label]'\",
                  },
                  ...
              }
          },
          {
              ...
          }
      ],\n`;
			} else if (section.id !== 'subClusterDescription') {
				// Regular sections become top-level properties (skip subClusterDescription as it's integrated above)
				dynamicStructure += `    "${section.label}": "${section.value}",\n`;
			}
		});

		// Remove trailing comma and newline from the last section
		dynamicStructure = dynamicStructure.replace(/,\n$/, '');
		console.log(`[${current()}]`+ "[ReportRefinement] dynamicStructure", dynamicStructure);
		
		// Replace the placeholder in assistantPrompt2
		assistantPrompt2 = assistantPrompt2_template.replace("<DYNAMIC_STRUCTURE>", dynamicStructure);
	} else {
		// Use default structure if no reportStructure provided
		const defaultStructure = `    "Introduction": "<Introduction>",
    "Middle_paragraph": [
        {
            "id": "use the original cluster id",
            "name": "If the cluster's original name is empty, must summarize the content as the new name. If not, DO NOT change and use the original name",
            "summarization": "summarize this cluster consist of documents",
            "text": "<ClusterDescription>",
            "name entities": "list important entities in 'text' with document id as citation, like 'name[document_id1, document_id2]'.",
            "keywords": "list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 id, document2 id]'",
            "subclusters": {
                "subcluster_id": {
                    "name": "If the cluster's original name is empty, must summarize the content as the new name. If not, DO NOT change and use the original name",
                    "text": "<ClusterDescription>",
                },
            }
        },
        {
            ...
        }
    ],
    "Conclusion": "<Conclusion>"`;
		assistantPrompt2 = assistantPrompt2_template.replace("<DYNAMIC_STRUCTURE>", defaultStructure);
	}

	// document and cluster prompt according to their orders
	const doc_prompt = "Current document structure: \n\n"
	const doc = JSON.stringify(doc_structure, null, "\t");

	console.log(`[${current()}]`+ "[ReportRefinement] doc_structure (clusters_v2)", doc_structure);

	// const doc_structure_prompt = "\n\n Please refer to the document structure below to identify main clusters and subclusters. The summarization of each cluster should be based on the document structure. \n\n"
	// const doc_structure_2 = JSON.stringify(hierarchicalStructure, null, "\t");

	// interaction info
    const highlight = human_interation["highlight"];
    const omit_hl = human_interation["negative_highlight"];
    const annotation = human_interation["annotation"];

	// 1a) highlight
	// current: highlight with weights, weights are the number of times the word is highlighted
	let hl_prompt;
	if (Object.keys(highlight).length !== 0){
		const hl_prompt1 = `I have some word weights of important words. You must add the details of those words in the report:`
		const hl_prompt2 = JSON.stringify(highlight, null, "\t");
		hl_prompt = hl_prompt1 + "\n" + hl_prompt2;	}
	else {
		hl_prompt = ""
	}

	// 1b) negative highlight
    let nega_hl_prompt = "";
    if (Object.keys(omit_hl).length !== 0){
        if (Object.keys(omit_hl).length !== 0){
            const nega_hl_prompt1 = `I have some word weights of unimportant words. You must avoid using those words in the report:`
            const nega_hl_prompt2 = JSON.stringify(omit_hl, null, "\t");
            nega_hl_prompt = nega_hl_prompt1 + "\n" + nega_hl_prompt2;
        }
        else {
            nega_hl_prompt = ""
        }
    }else{
        nega_hl_prompt = ""
    }

	// 2) annotation
    let annot_prompt2 = "";
    if (Object.keys(annotation.cluster).length !== 0 || Object.keys(annotation.node).length !== 0){
        console.log(`[${current()}]`+ "[ReportRefinement] annotation", annotation)

        const annot_prompt1 = `I have annotations tied with nodes. The annotations are the information that I want you to add in the report rather than the cluster name.You must generate the report according to the annotation information I input.
        Annotation information:
        `
        if (Object.keys(annotation.cluster).length !== 0 || Object.keys(annotation.node).length !== 0){
            annot_prompt2 = annot_prompt1 + "\n" + JSON.stringify(annotation, null, "\t");
        }else {
            annot_prompt2 = ""
        }
    }else{
        annot_prompt2 = ""
    }

	// final prompt
	const interaction_prompt = "Current human visual marks: \n" + "Highlights represent the emphasis of the user. \n" + hl_prompt + "\n" + "\n"  + "Negative highlights represent the words that the user wants to avoid in the report. \n" + nega_hl_prompt + "\n" + "\n" + "Annotations represent the personal insights that the user wants to add in the report. But do not use it to change the cluster name. \n" + annot_prompt2;
	// console.log("UserPrompt: ", prompt);

	// replace the prompt with the newest one
	// systemPrompt2 = systemPrompt2.replace("<Task Description>", taskP);
	// assistantPrompt = assistantPrompt.replace("<Introduction>", introP).replace("<ClusterDescription>", clusterP).replace("<Conclusion>", conclusionP);

	const input_prompt1 = await buildPromptForOpenAi_agent(doc_prompt+doc, systemPrompt1, previousReport, doc_structure_diff, human_interation_diff);
  // const input_prompt1 = await buildPromptForOpenAi_agent(doc_prompt+doc, systemPrompt1, previousReport, doc_structure_diff, human_interation_diff);

	console.log(`[${current()}]`+ "[ReportRefinement] input_prompt systemPrompt: ", systemPrompt1)
	console.log(`[${current()}]`+ "[ReportRefinement] input_prompt: docPrompt", doc_prompt+doc)
	console.log(`[${current()}]`+ "[ReportRefinement] input_prompt: interactionPrompt", interaction_prompt)
	logger.logUserAction("[ReportRefinement] input_prompt_space_changes_inference", {details: {
		systemPrompt: systemPrompt1,
		docPrompt: doc_prompt+doc,
    previousReport: previousReport,
    doc_structure_diff: doc_structure_diff,
    human_interation_diff: human_interation_diff,
		// interactionPrompt: interaction_prompt,
		// input_prompt: input_prompt1,
	}});

  let taskDecription_prompt = "";
  if (hasTaskDescriptionChanges) {
    taskDecription_prompt = "New task description: " + JSON.stringify(taskDescription, null, "\t");
  }
  else{
    taskDecription_prompt = "No task description changes";
  }

  let reportStructure_prompt = "";
  if (hasReportStructureChanges){
    reportStructure_prompt = "Report structure changes: " + JSON.stringify(reportStructureComparison.changes, null, "\t");
  }
  else{
    reportStructure_prompt = "No report structure changes";
  }
  const input_prompt1_promptChanges = await buildPromptForOpenAi_agent2(previousReport, taskDecription_prompt, reportStructure_prompt); 
  // console.log(`[${current()}]`+ "[ReportRefinement] assistantPrompt2: ", assistantPrompt2)
  logger.logUserAction("[ReportRefinement] input_prompt_prompt_changes_inference", {details: {
		previousReport: previousReport,
    taskDecription_prompt: taskDecription_prompt,
    reportStructure_prompt: reportStructure_prompt,
	}});

	try {
		// Prefer API key from dialog (localStorage / #openai_key_risky_but_cool), then REACT_APP_OPENAI_API_KEY.
		const apiKeyFromDangerousApiKeyInput = getOpenAIApiKey();
		if (!apiKeyFromDangerousApiKeyInput) {
			throw new Error('OpenAI API key is required. Enter it in the API Key dialog or set REACT_APP_OPENAI_API_KEY.');
		}

        // Reasoning LLM call
        const reasoningModel = reportRefineSettings.reasoning_model;
        const reasoningMaxTokens = reportRefineSettings.reasoning_max_tokens;
        const reasoningTemperature = reportRefineSettings.reasoning_temperature;
        const refinementModel = reportRefineSettings.refine_model;
        const refinementMaxTokens = reportRefineSettings.refine_max_tokens;
        const refinementTemperature = reportRefineSettings.refine_temperature;

        let reasoningMaxTokensParam = {};
        if (reasoningModel.startsWith('gpt-') || reasoningModel.startsWith('oai-')) {
          reasoningMaxTokensParam = { max_tokens: reasoningMaxTokens };
        } else if (reasoningModel.startsWith('o1') || reasoningModel.startsWith('o3') || reasoningModel.startsWith('o4')) {
          reasoningMaxTokensParam = { max_completion_tokens: reasoningMaxTokens };
        } else {
          reasoningMaxTokensParam = { max_tokens: reasoningMaxTokens };
        }
        function supportsTemperature(modelName) {
          return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
        }
        let reasoningTempParam = {};
        if (supportsTemperature(reasoningModel)) {
          reasoningTempParam = { temperature: reasoningTemperature };
        }
        function supportsSystemRole(modelName) {
          return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
        }
        function supportsResponseFormat(modelName) {
          return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
        }
        // Patch reasoning messages
        let responseFormatParam1 = {};
        if (supportsResponseFormat(reasoningModel)) {
          responseFormatParam1 = { response_format: { type: 'json_object' } };
        }
        let patchedMessages1 = input_prompt1;
        if (!supportsSystemRole(reasoningModel) && Array.isArray(input_prompt1)) {
          if (input_prompt1[0]?.role === 'system') {
            if (input_prompt1[1] && input_prompt1[1].role === 'user') {
              patchedMessages1 = [...input_prompt1];
              patchedMessages1[1] = {
                ...patchedMessages1[1],
                content: patchedMessages1[0].content + '\n' + patchedMessages1[1].content
              };
              patchedMessages1.shift();
            } else {
              patchedMessages1 = [...input_prompt1];
              patchedMessages1[0] = { ...patchedMessages1[0], role: 'user' };
            }
          }
        }

        let patchedMessages1_promptChanges = input_prompt1_promptChanges;
        if (!supportsSystemRole(reasoningModel) && Array.isArray(input_prompt1_promptChanges)) {
          if (input_prompt1_promptChanges[0]?.role === 'system') {
            if (input_prompt1_promptChanges[1] && input_prompt1_promptChanges[1].role === 'user') { 
              patchedMessages1_promptChanges = [...input_prompt1_promptChanges];
              patchedMessages1_promptChanges[1] = {
                ...patchedMessages1_promptChanges[1],
                content: patchedMessages1_promptChanges[0].content + '\n' + patchedMessages1_promptChanges[1].content
              };
                patchedMessages1_promptChanges.shift();
            } else {
              patchedMessages1_promptChanges = [...input_prompt1];
              patchedMessages1_promptChanges[0] = { ...patchedMessages1_promptChanges[0], role: 'user' };
            }
          }
        }

        let openAiResponse1: GPT4CompletionResponse | null = null;
        if (hasStructureChanges || hasInteractionChanges || hasReportStructureChanges){
          openAiResponse1 = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
              model: reasoningModel,
              ...responseFormatParam1,
              ...reasoningMaxTokensParam,
              ...reasoningTempParam,
              messages: patchedMessages1,
          })

          if (!openAiResponse1) {
            console.log(`[${current()}]`+ '[ReportRefinement] No reasoning LLM call made, skipping to refinement');
            return null;
          }
  
          if (openAiResponse1.error) {
            throw new Error(openAiResponse1.error.message)
          }
  
          const hm_intention_space = "Human intention: " + openAiResponse1.choices[0].message.content
  
          console.log(`[${current()}]`+ '[ReportRefinement] openAiResponse hm_intention_space: ', hm_intention_space)
        }

        let openAiResponse1_promptChanges: GPT4CompletionResponse | null = null;
        if (hasTaskDescriptionChanges || hasReportStructureChanges) {
          openAiResponse1_promptChanges = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
            model: reasoningModel,
            ...responseFormatParam1,
            ...reasoningMaxTokensParam,
            ...reasoningTempParam,
            messages: patchedMessages1_promptChanges,
          })

          if (openAiResponse1_promptChanges && openAiResponse1_promptChanges.error) {
            throw new Error(openAiResponse1_promptChanges.error.message)
          }
  
          const hm_intention_promptChanges = "Human intention_promptChanges: " + openAiResponse1_promptChanges.choices[0].message.content
  
          console.log(`[${current()}]`+ '[ReportRefinement] openAiResponse hm_intention_promptChanges: ', hm_intention_promptChanges)


        }

        // Parse the response to check if command exists and is not empty
        let parsedIntention;
        try {
          // Helper function to safely parse JSON with fallback
          const safeJsonParse = (content, fallback) => {
            if (!content) return fallback;
            try {
              return JSON.parse(content);
            } catch (e) {
              console.warn(`[${current()}]`+ '[ReportRefinement] Failed to parse JSON, using fallback:', e);
              return fallback;
            }
          };

          const defaultResponse = { "Reasoning": "", "Command": "" };
          const parsedIntention_space = safeJsonParse(openAiResponse1?.choices[0].message.content, defaultResponse);
          const parsedIntention_prompt = safeJsonParse(openAiResponse1_promptChanges?.choices[0].message.content, defaultResponse);
          
          console.log(`[${current()}]`+ '[ReportRefinement] Raw LLM response space:', openAiResponse1?.choices[0].message.content);
          console.log(`[${current()}]`+ '[ReportRefinement] Raw LLM response prompt:', openAiResponse1_promptChanges?.choices[0].message.content);
          console.log(`[${current()}]`+ '[ReportRefinement] Parsed intention space:', parsedIntention_space);
          console.log(`[${current()}]`+ '[ReportRefinement] Parsed intention prompt:', parsedIntention_prompt);
          
          // Combine both parsed intentions into one JSON object
          parsedIntention = {
            "Space_reasoning": parsedIntention_space["Reasoning"] || "",
            "Prompt_reasoning": parsedIntention_prompt["Reasoning"] || "",
            "Space_command": parsedIntention_space["Command"] || "",
            "Prompt_command": parsedIntention_prompt["Command"] || ""
          };
          
          dispatch(setRefineReactMessage(parsedIntention));
        } catch (parseError) {
          console.error(`[${current()}]`+ '[ReportRefinement] Failed to parse first LLM response:', parseError);
          // Provide a fallback parsedIntention object
          parsedIntention = {
            "Space_reasoning": "",
            "Prompt_reasoning": "",
            "Space_command": "",
            "Prompt_command": ""
          };
          dispatch(setRefineReactMessage(parsedIntention));
        }

		// Only run the second LLM if the command exists and is not empty
    console.log(`[${current()}]`+ '[ReportRefinement] parsedIntention', parsedIntention)
    console.log(`[${current()}]`+ '[ReportRefinement]  (parsedIntention.Space_command || parsedIntention.Prompt_command)',  (parsedIntention.Space_command || parsedIntention.Prompt_command))
    console.log(`[${current()}]`+ '[ReportRefinement] (parsedIntention.Space_command.trim() !== "" || parsedIntention.Prompt_command.trim() !== "")',  (parsedIntention.Space_command.trim() !== "" || parsedIntention.Prompt_command.trim() !== ""))

        if (parsedIntention && (parsedIntention.Space_command || parsedIntention.Prompt_command) && (parsedIntention.Space_command.trim() !== "" || parsedIntention.Prompt_command.trim() !== "")) {
          console.log(`[${current()}]`+ '[ReportRefinement] Command found, proceeding with second LLM call');

        const spaceCommand = parsedIntention["Space_command"] || "";
        const promptCommand = parsedIntention["Prompt_command"] || "";
        const combinedCommand = (spaceCommand + "\n" + promptCommand).trim();
        console.log(`[${current()}]`+ '[ReportRefinement] Combined command for second LLM:', combinedCommand);
        const input_prompt2 = await buildPromptForOpenAi(doc_prompt+doc, interaction_prompt, systemPrompt2, assistantPrompt2, previousReport, doc_structure_diff, human_interation_diff, combinedCommand);
        logger.logUserAction("[ReportRefinement] input_prompt_refinement", {details: {
          systemPrompt: systemPrompt2,
          docPrompt: doc_prompt+doc,
          interactionPrompt: interaction_prompt,
          assistantPrompt: assistantPrompt2,
          previousReport: previousReport,
          doc_structure_diff: doc_structure_diff,
          human_interation_diff: human_interation_diff,
          combinedCommand: combinedCommand,
        }});

        // Refinement LLM call
        let refinementMaxTokensParam = {};
        if (refinementModel.startsWith('gpt-') || refinementModel.startsWith('oai-')) {
          refinementMaxTokensParam = { max_tokens: refinementMaxTokens };
        } else if (refinementModel.startsWith('o1') || refinementModel.startsWith('o3') || refinementModel.startsWith('o4')) {
          refinementMaxTokensParam = { max_completion_tokens: refinementMaxTokens };
        } else {
          refinementMaxTokensParam = { max_tokens: refinementMaxTokens };
        }
        let refinementTempParam = {};
        if (supportsTemperature(refinementModel)) {
          refinementTempParam = { temperature: refinementTemperature };
        }
        function supportsResponseFormat(modelName) {
          return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
        }
        // Patch refinement messages
        let responseFormatParam2 = {};
        if (supportsResponseFormat(refinementModel)) {
          responseFormatParam2 = { response_format: { type: 'json_object' } };
        }
        let patchedMessages2 = input_prompt2;
        if (!supportsSystemRole(refinementModel) && Array.isArray(input_prompt2)) {
          if (input_prompt2[0]?.role === 'system') {
            if (input_prompt2[1] && input_prompt2[1].role === 'user') {
              patchedMessages2 = [...input_prompt2];
              patchedMessages2[1] = {
                ...patchedMessages2[1],
                content: patchedMessages2[0].content + '\n' + patchedMessages2[1].content
              };
              patchedMessages2.shift();
            } else {
              patchedMessages2 = [...input_prompt2];
              patchedMessages2[0] = { ...patchedMessages2[0], role: 'user' };
            }
          }
        }
        const openAiResponse2 = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
            model: refinementModel,
            ...responseFormatParam2,
            ...refinementMaxTokensParam,
            ...refinementTempParam,
            messages: patchedMessages2,
        })

        if (openAiResponse2.error) {
          throw new Error(openAiResponse2.error.message)
        }

        const response = openAiResponse2.choices[0].message.content
        console.log(`[${current()}]`+ '[ReportRefinement] openAiResponse report: ', response)

        return response;
		} else {
			console.log(`[${current()}]`+ '[ReportRefinement] No command found, skipping second LLM call');
			return null;
		}
	} catch (e) {
		throw e
	}
  return null;

}

async function buildPromptForOpenAi_agent (doc_prompt, systemPrompt, previousReport, doc_structure_diff, human_interation_diff): Promise<GPT4Message[]> {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.
	const userMessages: MessageContent = [
		// {
		// 	type: 'text',
		// 	text: doc_prompt + "\n" + interaction_prompt,
		// },
		{
			type: 'text',
			text: "previous report: " + previousReport,
		},
    {
        type: 'text',
        text: "cluster changes: " + JSON.stringify(doc_structure_diff, null, "\t") + "\n" + "human interaction changes: " + JSON.stringify(human_interation_diff, null, "\t"),
    }
	]

  console.log(`[${current()}]`+ "[ReportRefinement] report refinement space changes reference prompt", [
		{ role: 'system', content: systemPrompt},
		{ role: 'user', content: userMessages},
    { role: 'assistant', content: assistantPrompt1},
	])

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt},
		{ role: 'user', content: userMessages},
    { role: 'assistant', content: assistantPrompt1},
	]
}

async function buildPromptForOpenAi_agent2 (previousReport, taskDescriptionChanges, reportStructureChanges): Promise<GPT4Message[]> {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.
	const userMessages: MessageContent = [
		{
			type: 'text',
			text: "previous report: " + previousReport,
		},
    {
      type: 'text',
      text: "task description changes: " + taskDescriptionChanges + "\n" + "report structure changes: " + reportStructureChanges,
    }
	]

  console.log(`[${current()}]`+ "[ReportRefinement] report refinement report structure changes reference prompt", [
		{ role: 'system', content: systemPrompt1_promptChanges},
		{ role: 'user', content: userMessages},
    { role: 'assistant', content: assistantPrompt1_promptChanges},
	])

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt1_promptChanges},
		{ role: 'user', content: userMessages},
    { role: 'assistant', content: assistantPrompt1_promptChanges},
	]
}

async function buildPromptForOpenAi (doc_prompt, interaction_prompt, systemPrompt, assistantPrompt2, previousReport, doc_structure_diff, human_interation_diff, human_intention): Promise<GPT4Message[]> {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.
	const userMessages: MessageContent = [
		{
			type: 'text',
			text: doc_prompt + "\n" + interaction_prompt,
		},
		{
			type: 'text',
			text: previousReport,
		},
    {
        type: 'text',
        text: "cluster changes: " + JSON.stringify(doc_structure_diff, null, "\t") + "\n" + "human interaction changes: " + JSON.stringify(human_interation_diff, null, "\t"),
    },
    {
			type: 'text',
			text: human_intention,
		},
	]

	// combine the user prompt with the system prompt
  console.log(`[${current()}]`+ "[ReportRefinement] report refinement prompt", [
		{ role: 'system', content: systemPrompt},
		{ role: 'user', content: userMessages},
		{ role: 'assistant', content: assistantPrompt2},
	])
	return [
		{ role: 'system', content: systemPrompt},
		{ role: 'user', content: userMessages},
		{ role: 'assistant', content: assistantPrompt2},
	]
}
