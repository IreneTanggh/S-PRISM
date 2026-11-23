import { current } from '../../LexicalEditor/time.js';

export function spacePrompt (snapshot) {
	const stringified = JSON.stringify(snapshot);
	const jsondata = JSON.parse(stringified);
	const data = jsondata.store;

	var dict = {}
	var annotation = {};
	var cluster = {};
	var highlight = {};
	var arrow = {};
	var omit_hl = {};

	var hasCluster = false;

	var doc_prompt = "";
	var doc = "";
	var interaction_prompt = "";


	for (const key in data) {
		if (data[key].id.includes("shape")) {
			if (data[key]["type"] === "frame") {
				hasCluster = true;
			}
		}
	}

	if (!hasCluster) {
		for (const key in data) {
			if (data[key]["type"] === "xx_html") {
				dict[data[key].props.label] = {
					content: data[key].props.content, 
					highlight: data[key].props.highlight,
				}
			}
		}
		console.log(`[${current()}]`+ "[spacePrompt] without cluster dict", dict);

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
		console.log(`[${current()}]`+ "[SpaceComparison] highlight", highlight);

		// document and cluster prompt according to their orders
		doc_prompt = "Here are the documents: \n\n"
		doc = JSON.stringify(dict, null, "\t");

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
		interaction_prompt = hl_prompt;
	}
	else {
		for (const key in data) {
			if (data[key].id.includes("shape")) {
				if (data[key]["type"] === "frame") {
					dict[data[key].id] = 
					{
						name: data[key].props.name, 
						text: {},
						x: data[key].props.x,
						y: data[key].props.y,
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
						content: data[key].props.content, 
						label: data[key].props.label,
						highlight: data[key].props.highlight,
						commonhl: data[key].props.commonhl,
						omithl: data[key].props.omithl,
						
					}
				}
			}
		}
	
		for (const key in arrow){
			if (key in annotation){
				annotation[key].connect = arrow[key].id;
				annotation[key].connectType = arrow[key].type;
			}
		}
	
		console.log(`[${current()}]`+ "[spacePrompt] with cluster dict", dict);

		// cluster info
		for (const key in dict){
			cluster[key] = {};
			cluster[key].name = dict[key].name;
			// console.log("dict[key].name", dict[key].name)
			cluster[key].member = {};
			for (const id in dict[key].text){
				cluster[key].member[dict[key].text[id].label] = dict[key].text[id].content;
				
				//highlight
				if (dict[key].text[id].highlight.length===0 && dict[key].text[id].commonhl.length===0 && dict[key].text[id].omithl.length===0){
					continue;
				}
				let hl = dict[key].text[id].highlight;
				const omithl = dict[key].text[id].omithl;
				if(dict[key].text[id].commonhl!==undefined){
					hl = hl.concat(dict[key].text[id].commonhl);
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
		console.log(`[${current()}]`+ "[spacePrompt] highlight", highlight);
		console.log(`[${current()}]`+ "[spacePrompt] omit_hl", omit_hl);

		// document and cluster prompt according to their orders
		doc_prompt = "Here are the document clusters and their contents: \n\n"
		doc = JSON.stringify(cluster, null, "\t");

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
				// console.log("xuxinid", data[id].id);
				annot.node[data[id].props.label] = annotation[key].text;
			}
			else if (annotation[key].directConnect.type ==="frame"){
				const id = annotation[key].directConnect.id;
				annot.cluster[data[id].id] = annotation[key].text;
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
		interaction_prompt = hl_prompt + "\n" + "\n" + nega_hl_prompt + "\n" + "\n" + annot_prompt2;
		// console.log("UserPrompt: ", prompt);

	}

	// const userMessages = await buildPromptForOpenAi(doc_prompt+doc, interaction_prompt);
	console.log(`[${current()}]`+ "[spacePrompt] input_prompt: docPrompt", doc_prompt+doc)
	console.log(`[${current()}]`+ "[spacePrompt] input_prompt: interactionPrompt", interaction_prompt)

	return [
		{
			type: 'text',
			text: doc_prompt+doc,
		},
		{
			type: 'text',
			text: interaction_prompt,
		}
	];
}

