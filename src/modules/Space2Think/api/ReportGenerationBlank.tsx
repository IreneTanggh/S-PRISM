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

let systemPromptBlank = `<Task Description> I want you to output a report after clustering those documents.

I will provide all documents with indexes in the task in the user message. Also, I may have some human interaction information at the end of user message. Please cluster those documents first and write a summarization report of the clusters rather than listing points. Do not include words like "cluster" or "document" in the report.
`

let assistantPromptBlank = `The returned JSON objects should follow this format:
{
    <DYNAMIC_STRUCTURE>
}

Note you should use cluster and node id provided to you in the input JSON object.
`
// add "\n" after each prompt

//hard code ChatGPT API here, if you publicize the code, you need to remove it
// process.env.OPENAI_API_KEY="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"
// still need text prompt and interaction prompt

export async function reportGenerationBlank (snapshot, taskP, reportStructure, model = 'gpt-4o-mini', max_tokens = 3000, temperature = 0) {
	const stringified = JSON.stringify(snapshot);
	const jsondata = JSON.parse(stringified);
	const data = jsondata.store;
	console.log(`[${current()}]`+ "[ReportGenerationBlank] jsondata", data);

	var dict = {}
	var highlight = {}
	
	for (const key in data) {
		if (data[key]["type"] === "xx_html") {
			dict[data[key].props.label] = {
				content: data[key].props.content, 
				highlight: data[key].props.highlight,
			}
		}
	}

	console.log(`[${current()}]`+ "[ReportGenerationBlank] dict", dict);

	// cluster info
	for (const key in dict){
		if (dict[key].highlight.length===0){
			continue;
		}
		let hl = dict[key].highlight;

		for (const n in hl){
			const word = hl[n];
			if (word in highlight){
				highlight[word] += 1;
			} else {
				highlight[word] = 1;
			}
		}
	}
	console.log(`[${current()}]`+ "[ReportGenerationBlank] highlight", highlight);

	// document and cluster prompt according to their orders
	const doc_prompt = "Here are the documents: \n\n"
	const doc = JSON.stringify(dict, null, "\t");

	// interaction info

	// 1a) highlight
	// current: highlight with weights, weights are the number of times the word is highlighted
	let hl_prompt = "";
	if (Object.keys(highlight).length !== 0){
		const hl_prompt1 = `I have some word weights of important words. You must add the details of those words in the report:`
		const hl_prompt2 = JSON.stringify(highlight, null, "\t");
		hl_prompt = hl_prompt1 + "\n" + hl_prompt2;	}
	else {
		hl_prompt = ""
	}

	// final prompt
	const interaction_prompt = hl_prompt;
	// console.log("UserPrompt: ", prompt);

	// Build dynamic structure based on reportStructure
	let dynamicStructure = "";
	
	reportStructure.forEach((section, index) => {
		if (section.id === 'clusterDescription') {
			// Special handling for cluster description - it becomes the Middle_paragraph
			dynamicStructure += `    "Middle_paragraph": [
        {
            "id": "",
            "files": "The list of labels of which the documents belong this cluster",
            "name": "summarize the content as the new cluster name.",
            "summarization": "summarize this cluster consist of documents",
            "text": "${section.value}. Must include citations in the text, like 'name [document1 id, document2 id]'.",
            "name entities": "list important entities in 'text' with document id as citation, like 'name [document1 id, document2 id]'.",
            "keywords": "list important keywords you found in the input JSON cluster with document id as citation, like 'keyword[document1 id, document2 id]'",
        },
        {
            ...
        }
    ],\n`;
		} else {
			// Regular sections become top-level properties
			dynamicStructure += `    "${section.label}": "${section.value}",\n`;
		}
	});

	// Remove trailing comma and newline from the last section
	dynamicStructure = dynamicStructure.replace(/,\n$/, '');
	console.log(`[${current()}]`+ "[ReportGenerationBlank] dynamicStructure", dynamicStructure)
	
	// replace the prompt with the newest one
	systemPromptBlank = systemPromptBlank.replace("<Task Description>", taskP);
	assistantPromptBlank = assistantPromptBlank.replace("<DYNAMIC_STRUCTURE>", dynamicStructure);

	const input_prompt = await buildPromptForOpenAiBlank(doc_prompt+doc, interaction_prompt);
	// console.log(`[${current()}]`+ "[ReportGenerationBlank] input_prompt: ", input_prompt)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt systemPrompt: ", systemPromptBlank)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt assistantPrompt: ", assistantPromptBlank)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt: docPrompt", doc_prompt+doc)
	console.log(`[${current()}]`+ "[ReportGeneration] input_prompt: interactionPrompt", interaction_prompt)

	try {
		// Prefer API key from dialog (localStorage / #openai_key_risky_but_cool), then REACT_APP_OPENAI_API_KEY.
		const apiKeyFromDangerousApiKeyInput = getOpenAIApiKey();
		if (!apiKeyFromDangerousApiKeyInput) {
			throw new Error('OpenAI API key is required. Enter it in the API Key dialog or set REACT_APP_OPENAI_API_KEY.');
		}

       // Detect model type
       const isOpenAIModel = model.startsWith('gpt-') || model.startsWith('oai-');
       const isOModel = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');

       let patchedMessages = input_prompt;
       if (isOModel && Array.isArray(input_prompt)) {
         // Always merge system into first user message for o models
         if (input_prompt[0]?.role === 'system') {
           if (input_prompt[1] && input_prompt[1].role === 'user') {
             patchedMessages = [...input_prompt];
             patchedMessages[1] = {
               ...patchedMessages[1],
               content: patchedMessages[0].content + '\n' + patchedMessages[1].content + '\nPlease reply ONLY in valid JSON. Do not include any text outside the JSON object.'
             };
             patchedMessages.shift();
           } else {
             patchedMessages = [...input_prompt];
             patchedMessages[0] = { ...patchedMessages[0], role: 'user', content: patchedMessages[0].content + '\nPlease reply ONLY in valid JSON. Do not include any text outside the JSON object.' };
           }
         } else {
           // If no system, just append JSON instruction to last user message
           const jsonInstruction = '\nPlease reply ONLY in valid JSON. Do not include any text outside the JSON object.';
           let lastUserIdx = -1;
           for (let i = input_prompt.length - 1; i >= 0; i--) {
             if (input_prompt[i].role === 'user') {
               lastUserIdx = i;
               break;
             }
           }
           if (lastUserIdx !== -1) {
             patchedMessages = [...input_prompt];
             patchedMessages[lastUserIdx] = {
               ...patchedMessages[lastUserIdx],
               content: patchedMessages[lastUserIdx].content + jsonInstruction
             };
           }
         }
       } else if (!isOpenAIModel && Array.isArray(input_prompt)) {
         // For other non-gpt models, also merge system if present
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

       // Build params
       let params = { model, messages: patchedMessages };
       if (isOpenAIModel) {
         params = {
           ...params,
           response_format: { type: 'json_object' },
           max_tokens,
           temperature,
         };
       } else if (isOModel) {
         params = {
           ...params,
           max_completion_tokens: max_tokens,
         };
       } else {
         params = {
           ...params,
           max_tokens,
         };
       }

       // make a request to openai. `fetchFromOpenAi` is a next.js server action,
       // so our api key is hidden.
       const openAiResponse = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, params as any);

		if (openAiResponse.error) {
			throw new Error(openAiResponse.error.message)
		}

		const response = openAiResponse.choices[0].message.content

		console.log(`[${current()}]`+ '[ReportGenerationBlank] openAiResponse: ', response)

		return response;
	} catch (e) {
		throw e
	}

}

async function buildPromptForOpenAiBlank (content, interaction_prompt): Promise<GPT4Message[]> {

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
		{ role: 'system', content: systemPromptBlank},
		{ role: 'user', content: userMessages},
		{ role: 'assistant', content: assistantPromptBlank},
	]
}
