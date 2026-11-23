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

import { buildClusterStructures } from './buildClusterStructures.js';
import { logger } from '../../../utils/logger.js';

let systemPrompt = `<Task Description>

I will provide you with the clusters and documents in the first part of the user message, followed by some human interaction information at the end of the user message. Please write a summarization report of the clusters rather than listing points. Do not omit any cluster summaries. Even if one cluster includes all documents, summarize it as a standalone group. Do not include words like "cluster" or "document" in the report.
`

let assistantPrompt = `The returned JSON objects should follow this format:
{
    <DYNAMIC_STRUCTURE>
}

CRITICAL: Use ONLY the exact cluster structure from the input JSON object. You must NEVER create, invent, or generate any clusters or subclusters that are not explicitly defined in the input data. Use only the provided cluster IDs and node IDs exactly as given. Process all existing parent and child clusters from the JSON without adding, removing, or modifying the hierarchical structure. If no subclusters exist in the input, do not create any.
`
// add "\n" after each prompt

//hard code ChatGPT API here, if you publicize the code, you need to remove it
// process.env.OPENAI_API_KEY="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"
// still need text prompt and interaction prompt


export async function reportGeneration (snapshot, taskP, reportStructure, model = 'gpt-4o', max_tokens = 16000, temperature = 0) {
	const stringified = JSON.stringify(snapshot);
	const jsondata = JSON.parse(stringified);
	const data = jsondata.store;

	var dict = {}
	var annotation = {};
	var cluster = {};
	var highlight = {};
	var arrow = {};
	var omit_hl = {};
	let parent_dict = {}

	for (const key in data) {
		if (data[key].id.includes("shape")) {
			if (data[key]["type"] === "frame") {
				dict[data[key].id] = 
				{
					name: data[key].props.name, 
					text: {},
					x: data[key].props.x,
					y: data[key].props.y,
					parentId: data[key].parentId,
				};
			}
			if (data[key]["type"] === "frame" && data[key].parentId === "page:page") {
				parent_dict[data[key].id] = 
				{
					name: data[key].props.name, 
					children: {},
					member: {},
				};
			}
			
			if (data[key]["type"] === "note" && data[key].parentId !== "page:page") {
				annotation[data[key].id] = {
					text: data[key].props.text,
					parent: {
						id: data[key].parentId,
						name: data[data[key].parentId].props.name,
						type: data[data[key].parentId].type
					},
					connect: ""
				};
			}

			if (data[key]["type"] === "arrow") {
				if (data[key].props.start.boundShapeId !== undefined && data[key].props.end.boundShapeId != undefined){
					arrow[data[key].props.start.boundShapeId] = 
					{
						id: data[key].props.end.boundShapeId,
						type: data[data[key].props.end.boundShapeId].type,
					};

					arrow[data[key].props.end.boundShapeId] = 
					{
						id: data[key].props.start.boundShapeId,
						type: data[data[key].props.start.boundShapeId].type,
					};
				}
			}
		}
	}

	
	for (const key in data) {
		if (data[key]["type"] === "xx_html") {
			if(data[key].parentId in dict) {
				dict[data[key].parentId].text[data[key].id] = {
					label: data[key].props.label,
					content: data[key].props.content, 
					highlight: data[key].props.highlight,
					commonhl: data[key].props.commonhl,
					omithl: data[key].props.omithl,
					
				}
			}
		}
	}
	// let parent_dict = {}
	for (const key in dict){
		console.log(`[${current()}]`+ "[ReportGeneration] parent_dict key", key);
		const parentId = dict[key].parentId;
		if (parentId in parent_dict){
			// dict[key].parent = dict[dict[key].parentId];
			console.log(`[${current()}]`+ "[ReportGeneration] parent_dict parentId", parentId);
			parent_dict[parentId].children[key] = dict[key];
		}
		else if (dict[key].parentId === "page:page"){
			console.log(`[${current()}]`+ "[ReportGeneration] parent_dict key", key);
			parent_dict[key].member = dict[key].text;
		}
	}
	// for (const key in parent_dict){
	// 	if (parent_dict[key].children.length === 0){
	// 		parent_dict[key].member = dict[key].text;
	// 	}
	// }
	console.log(`[${current()}]`+ "[ReportGeneration] parent_dict debug dict", dict);

	console.log(`[${current()}]`+ "[ReportGeneration] parent_dict debug parent_dict", parent_dict);

	for (const key in arrow){
		if (key in annotation){
			annotation[key].connect = arrow[key].id;
			annotation[key].connectType = arrow[key].type;
		}
	}

	console.log(`[${current()}]`+ "[ReportGeneration] dict", dict);

	
	function sort_object(obj) {
		const items = Object.keys(obj).map(function(key) {
			return [key, obj[key]];
		});
		items.sort(function(first, second) {
			if (second[3] === first[3]) {
				return second[2] - first[2]; // Secondary sort by y in descending order
			}
			return second[3] - first[3];
		});
		const sorted_obj={}
		items.forEach((v) => {
			const use_key = v[0];
			const use_value = v[1];
			sorted_obj[use_key] = use_value;
		});
		return(sorted_obj)
	} 
	

	const sorted_dict = sort_object(dict);
	// Remove clusters with empty text
	for (const key in sorted_dict) {
		if (Object.keys(sorted_dict[key].text).length === 0) {
			delete sorted_dict[key];
		}
	}
	console.log(`[${current()}]`+ "[ReportGeneration] sorted_dict", sorted_dict);

	

	// Build hierarchical structure and get all file members for clusters with subclusters
	// const { hierarchicalStructure, clusterWithAllMembers, clusters_v2 } = buildClusterStructures(sorted_dict, data, current);
	
	// console.log(`[${current()}]`+ "[ReportGeneration] hierarchicalStructure", hierarchicalStructure)
	
	// Fourth pass: ensure main clusters (with parent page:page) include all files from their subclusters
	// for (const key in sorted_dict) {
	// 	if(key in hierarchicalStructure){
	// 		// For main clusters, make sure they include all files from their entire subtree
	// 		const allMembers = {};
			
	// 		// Function to recursively collect all members from this cluster and all its descendants
	// 		function collectAllMembersFromCluster(clusterId) {
	// 			// Add direct members from this cluster
	// 			for (const textId in sorted_dict[clusterId].text) {
	// 				allMembers[textId] = sorted_dict[clusterId].text[textId];
	// 			}
				
	// 			// Recursively add members from all children
	// 			const children = hierarchicalStructure[clusterId].children;
	// 			for (const childId of children) {
	// 				if (childId in sorted_dict){
	// 					for (const textId in sorted_dict[childId].text){
	// 						allMembers[textId] = sorted_dict[childId].text[textId];
	// 					}
	// 				}
	// 			}
	// 		}
			
	// 		collectAllMembersFromCluster(key);
	// 		clusterWithAllMembers[key].member = allMembers;
	// 	}else{
	// 		clusterWithAllMembers[key] = {
	// 			name: sorted_dict[key].name,
	// 			member: { ...sorted_dict[key].text } // Start with direct members
	// 		};
	// 	}
	// }
	
	// console.log(`[${current()}]`+ "[ReportGeneration] hierarchicalStructure", hierarchicalStructure);
	// console.log(`[${current()}]`+ "[ReportGeneration] clusterWithAllMembers", clusterWithAllMembers);

	// cluster info
	for (const key in sorted_dict){
		// cluster[key] = {};
		// cluster[key].name = sorted_dict[key].name;
		// console.log("sorted_dict[key].name", sorted_dict[key].name)
		// cluster[key].member = {};
		for (const id in sorted_dict[key].text){
			// cluster[key].member[sorted_dict[key].text[id].label] = sorted_dict[key].text[id].content;
			
			//highlight
			if (sorted_dict[key].text[id].highlight.length===0 && sorted_dict[key].text[id].commonhl.length===0 && sorted_dict[key].text[id].omithl.length===0){
				continue;
			}
			let hl = sorted_dict[key].text[id].highlight;
			const omithl = sorted_dict[key].text[id].omithl;
			if(sorted_dict[key].text[id].commonhl!==undefined){
				hl = hl.concat(sorted_dict[key].text[id].commonhl);
			}

			for (const n in hl){
				const word = hl[n];
				if (word in highlight){
					highlight[word] += 1;
				} else {
					highlight[word] = 1;
				}
			}

			for (const n in omithl){
				const word = omithl[n];
				if (word in omit_hl){
					omit_hl[word] += 1;
				} else {
					omit_hl[word] = 1;
				}
			}
		}
	}

	
	for (const key in parent_dict){
		cluster[key] = {};
		cluster[key].name = parent_dict[key].name;
		// cluster[key].childrenCluster = {};
		// console.log("sorted_dict[key].name", sorted_dict[key].name)
		if (Object.keys(parent_dict[key].member).length > 0){
			cluster[key].member = parent_dict[key].member;
		}

		if (Object.keys(parent_dict[key].children).length > 0){
			cluster[key].childrenCluster = {};
			for (const id in parent_dict[key].children){
				cluster[key].childrenCluster[id] = {};
				cluster[key].childrenCluster[id].name = parent_dict[key].children[id].name;
				cluster[key].childrenCluster[id].member = {}
				for (const id2 in parent_dict[key].children[id].text){
					cluster[key].childrenCluster[id].member[parent_dict[key].children[id].text[id2].label] = parent_dict[key].children[id].text[id2].content;
				}
			}
		}
	}
	
	console.log(`[${current()}]`+ "[ReportGeneration] highlight", highlight);
	console.log(`[${current()}]`+ "[ReportGeneration] omit_hl", omit_hl);
	console.log(`[${current()}]`+ "[ReportGeneration] cluster", cluster);

	// document and cluster prompt according to their orders
	const doc_prompt = "Here are the document clusters and their contents. You must ensure all clusters are thoroughly covered: \n\n"
	const doc = JSON.stringify(cluster, null, "\t");

	console.log(`[${current()}]`+ "[ReportGeneration] cluster", cluster);

	// const doc_prompt_structure = "\n\n Please refer to the document structure below to identify main clusters and subclusters. The summarization of each cluster should be based on the document structure. \n\n"
	// const doc_structure = JSON.stringify(hierarchicalStructure, null, "\t");

	// interaction info

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
		const nega_hl_prompt1 = `I have some word weights of unimportant words. You must avoid using those words in the report:`
		const nega_hl_prompt2 = JSON.stringify(omit_hl, null, "\t");
		nega_hl_prompt = nega_hl_prompt1 + "\n" + nega_hl_prompt2;
	}
	else {
		nega_hl_prompt = ""
	}

	// 2) annotation
	const annot = {
		cluster: {},
		node: {},
	}
	for (const key in annotation){
		if (annotation[key].connect !== "" && annotation[key].connectType === "xx_html"){
			annotation[key].directConnect = {
				id: annotation[key].connect,
				type: annotation[key].connectType,
			}
		}
		else {
			annotation[key].directConnect = {
				id: annotation[key].parent.id,
				type: annotation[key].parent.type,
			}
		}
		if (annotation[key].directConnect.type ==="xx_html"){
			const id = annotation[key].directConnect.id;
			if (annot.node[data[id].props.label]){
				annot.node[data[id].props.label].push(annotation[key].text);
			}
			else{
				annot.node[data[id].props.label] = [annotation[key].text];
			}
		}
		else if (annotation[key].directConnect.type ==="frame"){
			const id = annotation[key].directConnect.id;
			if (annot.cluster[data[id].id]){
				annot.cluster[data[id].id].push(annotation[key].text);
			}
			else{
				annot.cluster[data[id].id] = [annotation[key].text];
			}
		}
	}

	const annot_prompt1 = `I have annotations tied with nodes. You must generate the report according to the annotation information I input.
	Annotation information:
	`
	let annot_prompt2;
	if (Object.keys(annot.cluster).length !== 0 || Object.keys(annot.node).length !== 0){
		annot_prompt2 = annot_prompt1 + "\n" + JSON.stringify(annot, null, "\t");
	}else {
		annot_prompt2 = ""
	}

	// final prompt
	const interaction_prompt = hl_prompt + "\n" + "\n" + nega_hl_prompt + "\n" + "\n" + annot_prompt2;
	// console.log("UserPrompt: ", prompt);

	// replace the prompt with the newest one
	systemPrompt = systemPrompt.replace("<Task Description>", taskP);
	// Build dynamic structure based on reportStructure
	let dynamicStructure = "";
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
	            \"name\":\"If clusters have empty or null name fields, assign names to them. If not,preserve any provided original names exactly as given.\",
	            \"text\": \"${section.value}. Must include citations in the text, like 'name [document1 label, document2 label]'.\",
	            \"name entities\": \"list important entities in 'text' with document id as citation, like 'name[document_label1, document_label2]'.\",
	            \"keywords\": \"list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 label, document2 label]'\",
				\"subclusters\": {
					\"subcluster_id\": {
						\"name\": \"Only assign names to clusters that have empty or null name fields, and always preserve any provided original names exactly as given.\",
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
	        dynamicStructure += `    \"${section.label}\": \"${section.value}\",\n`;
	    }
	});
	// Remove trailing comma and newline from the last section
	dynamicStructure = dynamicStructure.replace(/,\n$/, '');
	assistantPrompt = assistantPrompt.replace("<DYNAMIC_STRUCTURE>", dynamicStructure);

	const input_prompt = await buildPromptForOpenAi(doc_prompt+doc, interaction_prompt);
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt systemPrompt: ", systemPrompt)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt assistantPrompt: ", assistantPrompt)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt: docPrompt", doc_prompt+doc)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt: interactionPrompt", interaction_prompt)
	// console.log(`[${current()}]`+ "[ReportGeneration] input_prompt: ", input_prompt)
	logger.logUserAction("[ReportGeneration] input_prompt", {details: {
		systemPrompt: systemPrompt,
		assistantPrompt: assistantPrompt,
		docPrompt: doc_prompt+doc,
		interactionPrompt: interaction_prompt,
	}});
	try {
		// Prefer API key from dialog (localStorage / #openai_key_risky_but_cool), then REACT_APP_OPENAI_API_KEY.
		const apiKeyFromDangerousApiKeyInput = getOpenAIApiKey();
		if (!apiKeyFromDangerousApiKeyInput) {
			throw new Error('OpenAI API key is required. Enter it in the API Key dialog or set REACT_APP_OPENAI_API_KEY.');
		}

		// Detect correct max tokens parameter
		let maxTokensParam = {};
		if (model.startsWith('gpt-') || model.startsWith('oai-')) {
			maxTokensParam = { max_tokens };
		} else if (model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) {
			maxTokensParam = { max_completion_tokens: max_tokens };
		} else {
			maxTokensParam = { max_tokens };
		}
		// Only include temperature if supported
		function supportsTemperature(modelName) {
			return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
		}
		let tempParam = {};
		if (supportsTemperature(model)) {
			tempParam = { temperature };
		}
		// Prepare messages for models that do not support 'system' role
		function supportsSystemRole(modelName) {
			return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
		}
		let patchedMessages = input_prompt;
		if (!supportsSystemRole(model) && Array.isArray(input_prompt)) {
			if (input_prompt[0]?.role === 'system') {
				if (input_prompt[1] && input_prompt[1].role === 'user') {
					patchedMessages = [...input_prompt];
					patchedMessages[1] = {
						...patchedMessages[1],
						content: patchedMessages[0].content + '\n' + patchedMessages[1].content
					};
					patchedMessages.shift();
				} else {
					patchedMessages = [...input_prompt];
					patchedMessages[0] = { ...patchedMessages[0], role: 'user' };
				}
			}
		}
		// Only include response_format if supported
		function supportsResponseFormat(modelName) {
			return modelName.startsWith('gpt-') || modelName.startsWith('oai-');
		}
		let responseFormatParam = {};
		if (supportsResponseFormat(model)) {
			responseFormatParam = { response_format: { type: 'json_object' } };
		}
		// make a request to openai. `fetchFromOpenAi` is a next.js server action,
		// so our api key is hidden.
		const openAiResponse = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
			model,
			...responseFormatParam,
			...maxTokensParam,
			...tempParam,
			messages: patchedMessages,
		})

		if (openAiResponse.error) {
			throw new Error(openAiResponse.error.message)
		}

		const response = openAiResponse.choices[0].message.content

		console.log(`[${current()}]`+ '[ReportGeneration] openAiResponse: ', response)

		return response;
	} catch (e) {
		throw e
	}

	return null;

}

async function buildPromptForOpenAi (content, interaction_prompt): Promise<GPT4Message[]> {

	// the user messages describe what the user has done and what they want to do next. they'll get
	// combined with the system prompt to tell gpt-4 what we'd like it to do.
	const userMessages: MessageContent = [
		{
			type: 'text',
			text: content,
		},
		{
			type: 'text',
			text: interaction_prompt,
		}
	]

	// combine the user prompt with the system prompt
	return [
		{ role: 'system', content: systemPrompt},
		{ role: 'user', content: userMessages},
		{ role: 'assistant', content: assistantPrompt},
	]
}
