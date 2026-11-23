import { current } from '../../../LexicalEditor/time.js';
import { buildClusterStructures } from '../buildClusterStructures.js';



function snapshot_distill(snapshot){
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
    var highlight_cluster = {};

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
		console.log(`[${current()}]`+ "[spaceComparison] parent_dict key", key);
		const parentId = dict[key].parentId;
		if (parentId in parent_dict){
			// dict[key].parent = dict[dict[key].parentId];
			console.log(`[${current()}]`+ "[spaceComparison] parent_dict parentId", parentId);
			parent_dict[parentId].children[key] = dict[key];
		}
		else if (dict[key].parentId === "page:page"){
			console.log(`[${current()}]`+ "[spaceComparison] parent_dict key", key);
			// Extract only label and content from each text item
			const filteredText = {};
			for (const textId in dict[key].text) {
				const label = dict[key].text[textId].label;
				const content = dict[key].text[textId].content;
				filteredText[label] = content;
			}
			parent_dict[key].member = filteredText;
		}
	}
	// for (const key in parent_dict){
	// 	if (parent_dict[key].children.length === 0){
	// 		parent_dict[key].member = dict[key].text;
	// 	}
	// }
	console.log(`[${current()}]`+ "[spaceComparison] parent_dict debug dict", dict);

	console.log(`[${current()}]`+ "[spaceComparison] parent_dict debug parent_dict", parent_dict);

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
            
            const doc_id = data[id].props.label;
            if (annot.node[doc_id]){
                annot.node[doc_id].push(annotation[key].text);
            }
            else{
                annot.node[doc_id] = [annotation[key].text];
            }
		}
		else if (annotation[key].directConnect.type ==="frame"){
			const id = annotation[key].directConnect.id;
            const cluster_id = data[id].id;
            if (annot.cluster[cluster_id]){
			    annot.cluster[cluster_id].push(annotation[key].text);
            }
            else{
                annot.cluster[cluster_id] = [annotation[key].text];
            }
		}
	}

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
    // for (const key in sorted_dict) {
	// 	if (Object.keys(sorted_dict[key].text).length === 0) {
	// 		delete sorted_dict[key];
	// 	}
	// }
	console.log(`[${current()}]`+ "[spaceComparison] sorted_dict", sorted_dict);
    
    // Build hierarchical structure and get all file members for clusters with subclusters
	const { hierarchicalStructure, clusterWithAllMembers, clusters_v2 } = buildClusterStructures(sorted_dict, data, current);
	
	console.log(`[${current()}]`+ "[spaceComparison] hierarchicalStructure", hierarchicalStructure)
	
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

    for (const key in sorted_dict){
		// cluster[key] = {};
		// cluster[key].name = sorted_dict[key].name;
		// console.log("sorted_dict[key].name", sorted_dict[key].name)
		// cluster[key].member = {};
		for (const id in sorted_dict[key].text){
			// cluster[key].member[sorted_dict[key].text[id].label] = sorted_dict[key].text[id].content;
			
			//highlight
			const highlightArray = sorted_dict[key].text[id].highlight || [];
			const commonhlArray = sorted_dict[key].text[id].commonhl || [];
			const omithlArray = sorted_dict[key].text[id].omithl || [];
			
			console.log(`[${current()}]`+ "[spaceComparison] Processing text item:", id, "highlight:", highlightArray, "commonhl:", commonhlArray, "omithl:", omithlArray);
			
			if (highlightArray.length === 0 && commonhlArray.length === 0 && omithlArray.length === 0){
				continue;
			}
			
			let hl = [...highlightArray]; // Create a copy to avoid modifying original
			const omithl = [...omithlArray];
			
			if(commonhlArray.length > 0){
				hl = hl.concat(commonhlArray);
			}

			console.log(`[${current()}]`+ "[spaceComparison] Final hl array:", hl, "omithl array:", omithl);

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
	
	console.log(`[${current()}]`+ "[spaceComparison] hierarchicalStructure", hierarchicalStructure);
	// console.log(`[${current()}]`+ "[spaceComparison] clusterWithAllMembers", clusterWithAllMembers);
    // console.log(`[${current()}]`+ "[spaceComparison] clusters_v2", clusters_v2);


    const doc_structure = cluster;
    console.log(`[${current()}]`+ "[spaceComparison] snapshot", snapshot);
    console.log(`[${current()}]`+ "[spaceComparison] doc_structure", doc_structure);

    const human_interation = {};
    human_interation["highlight"] = highlight;
    human_interation["negative_highlight"] = omit_hl;
    human_interation["annotation"] = annot;

    console.log(`[${current()}]`+ "[spaceComparison] Final highlight object:", highlight);
    console.log(`[${current()}]`+ "[spaceComparison] Final omit_hl object:", omit_hl);
    console.log(`[${current()}]`+ "[spaceComparison] Final human_interation:", human_interation);

    return [doc_structure, human_interation, hierarchicalStructure];
}

function cleanup_empty_arrays(obj) {
    /**
     * Recursively remove empty arrays and objects from the result object
     * @param {any} obj - The object to clean up
     * @returns {any} - The cleaned object
     */
    if (Array.isArray(obj)) {
        // Filter out empty arrays and clean each element
        const cleaned = obj
            .map(item => cleanup_empty_arrays(item))
            .filter(item => {
                if (Array.isArray(item)) return item.length > 0;
                if (typeof item === 'object' && item !== null) return Object.keys(item).length > 0;
                return true; // Keep non-array, non-object items
            });
        return cleaned;
    } else if (typeof obj === 'object' && obj !== null) {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleaned_value = cleanup_empty_arrays(value);
            // Only add non-empty values
            if (Array.isArray(cleaned_value)) {
                if (cleaned_value.length > 0) {
                    cleaned[key] = cleaned_value;
                }
            } else if (typeof cleaned_value === 'object' && cleaned_value !== null) {
                if (Object.keys(cleaned_value).length > 0) {
                    cleaned[key] = cleaned_value;
                }
            } else {
                // Keep primitive values (strings, numbers, booleans)
                cleaned[key] = cleaned_value;
            }
        }
        return cleaned;
    }
    return obj;
}

function compare_clusters(clusters1, clusters2) {
    /**
     * Compare two cluster dictionaries to find differences, including hierarchical changes.
     * 
     * @param {Object} clusters1 - First cluster dictionary
     * @param {Object} clusters2 - Second cluster dictionary
     * @returns {Object} Dictionary with cluster IDs as keys and all changes listed under each cluster
     */
    const result: {
        removed_clusters: string[];
        added_clusters: Array<{
            cluster_id: string;
            name: string;
        }>;
        cluster_changes: { [cluster_id: string]: {
            name_changes?: {
                old: any;
                new: any;
            };
            member_changes?: {
                removed: string[];
                added: string[];
            };
            subcluster_changes?: {
                removed: string[];
                added: string[];
                modified: Array<{
                    subcluster_id: string;
                    name_changes?: {
                        old: any;
                        new: any;
                    };
                    member_changes?: {
                        removed: string[];
                        added: string[];
                    };
                }>;
            };
            structural_changes?: {
                old_structure: string; // 'main' or 'sub'
                new_structure: string; // 'main' or 'sub'
                parent_cluster?: string; // if became subcluster, which cluster it's now under
            };
        }};
    } = {
        removed_clusters: [],
        added_clusters: [],
        cluster_changes: {}
    };

    // Helper function to create flattened dictionaries with all clusters and their hierarchy info
    function createFlattenedClusterDict(clusters) {
        const flattened = {};
        
        for (const clusterId in clusters) {
            const cluster = clusters[clusterId];
            
            // Add main cluster
            flattened[clusterId] = {
                ...cluster,
                _hierarchy_level: 'main',
                _parent_cluster: null
            };
            
            // Add subclusters
            if (cluster.childrenCluster) {
                for (const subclusterId in cluster.childrenCluster) {
                    const subcluster = cluster.childrenCluster[subclusterId];
                    flattened[subclusterId] = {
                        ...subcluster,
                        _hierarchy_level: 'sub',
                        _parent_cluster: clusterId
                    };
                }
            }
        }
        
        return flattened;
    }

    // Create flattened dictionaries
    const flattened1 = createFlattenedClusterDict(clusters1);
    const flattened2 = createFlattenedClusterDict(clusters2);

    // Get all cluster IDs from both dictionaries
    const all_cluster_ids = new Set([...Object.keys(flattened1), ...Object.keys(flattened2)]);

    // First pass: identify structural changes (clusters becoming subclusters or vice versa)
    for (const clusterId of all_cluster_ids) {
        if (clusterId in flattened1 && clusterId in flattened2) {
            const old_cluster = flattened1[clusterId];
            const new_cluster = flattened2[clusterId];
            
            // Check if hierarchy level changed
            if (old_cluster._hierarchy_level !== new_cluster._hierarchy_level) {
                if (!(clusterId in result.cluster_changes)) {
                    result.cluster_changes[clusterId] = {};
                }
                result.cluster_changes[clusterId].structural_changes = {
                    old_structure: old_cluster._hierarchy_level,
                    new_structure: new_cluster._hierarchy_level,
                    parent_cluster: new_cluster._parent_cluster
                };
            }
        }
    }

    // Second pass: identify truly removed and added clusters (not just restructured)
    for (const clusterId of all_cluster_ids) {
        if (clusterId in flattened1 && !(clusterId in flattened2)) {
            // Cluster exists in old but not in new - check if it was restructured
            const was_restructured = clusterId in result.cluster_changes && result.cluster_changes[clusterId].structural_changes;
            if (!was_restructured) {
                result.removed_clusters.push(clusterId);
            }
        } else if (!(clusterId in flattened1) && clusterId in flattened2) {
            // Cluster exists in new but not in old - check if it was restructured
            const was_restructured = clusterId in result.cluster_changes && result.cluster_changes[clusterId].structural_changes;
            if (!was_restructured) {
                // Check if this is a new subcluster - if so, don't add to added_clusters
                // as it will be handled in the subcluster changes
                const new_cluster = flattened2[clusterId];
                if (new_cluster._hierarchy_level === 'sub') {
                    // This is a new subcluster - it will be handled in subcluster changes
                    // We don't need to add it to added_clusters
                } else {
                    // This is a truly new main cluster
                    result.added_clusters.push({
                        cluster_id: clusterId,
                        name: new_cluster.name || 'Unnamed Cluster'
                    });
                }
            }
        }
    }

    // Third pass: find changes in clusters that exist in both dictionaries (including restructured ones)
    for (const clusterId of all_cluster_ids) {
        if (clusterId in flattened1 && clusterId in flattened2) {
            const cluster1 = flattened1[clusterId];
            const cluster2 = flattened2[clusterId];

            // Check for name changes
            if (cluster1.name !== cluster2.name) {
                if (!(clusterId in result.cluster_changes)) {
                    result.cluster_changes[clusterId] = {};
                }
                result.cluster_changes[clusterId].name_changes = {
                    old: cluster1.name,
                    new: cluster2.name
                };
            }

            // Check for member changes (only if both are at the same hierarchy level)
            if (cluster1._hierarchy_level === cluster2._hierarchy_level) {
                const members1 = new Set(Object.keys(cluster1.member || {}));
                const members2 = new Set(Object.keys(cluster2.member || {}));

                const removed_members = Array.from(members1).filter(member => !members2.has(member));
                const added_members = Array.from(members2).filter(member => !members1.has(member));

                if (removed_members.length > 0 || added_members.length > 0) {
                    if (!(clusterId in result.cluster_changes)) {
                        result.cluster_changes[clusterId] = {};
                    }
                    result.cluster_changes[clusterId].member_changes = {
                        removed: removed_members,
                        added: added_members
                    };
                }
            }

            // Check for subcluster changes (only for main clusters)
            if (cluster1._hierarchy_level === 'main' && cluster2._hierarchy_level === 'main') {
                const children1 = cluster1.childrenCluster || {};
                const children2 = cluster2.childrenCluster || {};
                
                const subcluster_ids1 = new Set(Object.keys(children1));
                const subcluster_ids2 = new Set(Object.keys(children2));

                const removed_subclusters = Array.from(subcluster_ids1).filter(id => !subcluster_ids2.has(id));
                const added_subclusters = Array.from(subcluster_ids2).filter(id => !subcluster_ids1.has(id));

                // Check for modifications in existing subclusters
                const modified_subclusters: Array<{
                    subcluster_id: string;
                    name_changes?: {
                        old: any;
                        new: any;
                    };
                    member_changes?: {
                        removed: string[];
                        added: string[];
                    };
                }> = [];
                const common_subclusters = Array.from(subcluster_ids1).filter(id => subcluster_ids2.has(id));

                for (const subcluster_id of common_subclusters) {
                    const subcluster1 = children1[subcluster_id];
                    const subcluster2 = children2[subcluster_id];
                    
                    const subcluster_changes: {
                        subcluster_id: string;
                        name_changes?: {
                            old: any;
                            new: any;
                        };
                        member_changes?: {
                            removed: string[];
                            added: string[];
                        };
                    } = {
                        subcluster_id: subcluster_id
                    };

                    // Check for name changes in subcluster
                    if (subcluster1.name !== subcluster2.name) {
                        subcluster_changes.name_changes = {
                            old: subcluster1.name,
                            new: subcluster2.name
                        };
                    }

                    // Check for member changes in subcluster
                    const sub_members1 = new Set(Object.keys(subcluster1.member || {}));
                    const sub_members2 = new Set(Object.keys(subcluster2.member || {}));

                    const removed_sub_members = Array.from(sub_members1).filter(member => !sub_members2.has(member));
                    const added_sub_members = Array.from(sub_members2).filter(member => !sub_members1.has(member));

                    console.log(`[${current()}]`+ "[spaceComparison] subcluster member check:", {
                        subcluster_id,
                        sub_members1: Array.from(sub_members1),
                        sub_members2: Array.from(sub_members2),
                        removed_sub_members,
                        added_sub_members
                    });

                    if (removed_sub_members.length > 0 || added_sub_members.length > 0) {
                        subcluster_changes.member_changes = {
                            removed: removed_sub_members,
                            added: added_sub_members
                        };
                        console.log(`[${current()}]`+ "[spaceComparison] subcluster member changes detected:", subcluster_changes);
                    }

                    // Only add to modified_subclusters if there are actual changes
                    if (subcluster_changes.name_changes || subcluster_changes.member_changes) {
                        modified_subclusters.push(subcluster_changes);
                    }
                }

                // Always create subcluster_changes entry if this is a main cluster with subclusters
                // This ensures we capture member changes even when no structural changes occur
                if (!(clusterId in result.cluster_changes)) {
                    result.cluster_changes[clusterId] = {};
                }
                
                if (!result.cluster_changes[clusterId].subcluster_changes) {
                    result.cluster_changes[clusterId].subcluster_changes = {
                        removed: [...new Set(removed_subclusters)],
                        added: [...new Set(added_subclusters)],
                        modified: modified_subclusters
                    };
                } else {
                    // Merge with existing subcluster_changes
                    result.cluster_changes[clusterId].subcluster_changes.removed = [
                        ...new Set([...result.cluster_changes[clusterId].subcluster_changes.removed, ...removed_subclusters])
                    ];
                    result.cluster_changes[clusterId].subcluster_changes.added = [
                        ...new Set([...result.cluster_changes[clusterId].subcluster_changes.added, ...added_subclusters])
                    ];
                    result.cluster_changes[clusterId].subcluster_changes.modified = [
                        ...result.cluster_changes[clusterId].subcluster_changes.modified,
                        ...modified_subclusters
                    ];
                }
                
                console.log(`[${current()}]`+ "[spaceComparison] subcluster_changes created/updated for cluster:", clusterId, {
                    removed: result.cluster_changes[clusterId].subcluster_changes.removed,
                    added: result.cluster_changes[clusterId].subcluster_changes.added,
                    modified: result.cluster_changes[clusterId].subcluster_changes.modified
                });
            }
        }
    }

    // Fourth pass: handle subcluster additions/removals for existing main clusters
    // This handles cases where:
    // 1. New subclusters are added to existing main clusters
    // 2. Subclusters are removed from existing main clusters  
    // 3. New main clusters are created with subclusters
    // This ensures subcluster changes are properly tracked as modifications to their parent clusters
    // rather than being treated as completely new/removed clusters
    for (const clusterId in clusters2) {
        if (clusterId in clusters1) {
            const cluster1 = clusters1[clusterId];
            const cluster2 = clusters2[clusterId];
            
            // Only process main clusters
            if (cluster1.childrenCluster || cluster2.childrenCluster) {
                const children1 = cluster1.childrenCluster || {};
                const children2 = cluster2.childrenCluster || {};
                
                const subcluster_ids1 = new Set(Object.keys(children1));
                const subcluster_ids2 = new Set(Object.keys(children2));
                
                // Find new subclusters that were added
                const new_subclusters = Array.from(subcluster_ids2).filter(id => !subcluster_ids1.has(id));
                // Find subclusters that were removed
                const removed_subclusters = Array.from(subcluster_ids1).filter(id => !subcluster_ids2.has(id));
                
                if (new_subclusters.length > 0 || removed_subclusters.length > 0) {
                    // Check if we already have a subcluster change entry for this cluster
                    if (!(clusterId in result.cluster_changes)) {
                        result.cluster_changes[clusterId] = {};
                    }
                    
                    if (!result.cluster_changes[clusterId].subcluster_changes) {
                        // Create new entry
                        result.cluster_changes[clusterId].subcluster_changes = {
                            removed: removed_subclusters,
                            added: new_subclusters,
                            modified: []
                        };
                    } else {
                        // Add to existing entry and deduplicate
                        const allAdded = [...result.cluster_changes[clusterId].subcluster_changes.added, ...new_subclusters];
                        const allRemoved = [...result.cluster_changes[clusterId].subcluster_changes.removed, ...removed_subclusters];
                        
                        result.cluster_changes[clusterId].subcluster_changes.added = [...new Set(allAdded)];
                        result.cluster_changes[clusterId].subcluster_changes.removed = [...new Set(allRemoved)];
                    }
                }
                
                // Also check for member changes in existing subclusters
                const existing_subclusters = Array.from(subcluster_ids1).filter(id => subcluster_ids2.has(id));
                for (const subcluster_id of existing_subclusters) {
                    const subcluster1 = children1[subcluster_id];
                    const subcluster2 = children2[subcluster_id];
                    
                    // Check for member changes in existing subcluster
                    const sub_members1 = new Set(Object.keys(subcluster1.member || {}));
                    const sub_members2 = new Set(Object.keys(subcluster2.member || {}));
                    
                    const removed_sub_members = Array.from(sub_members1).filter(member => !sub_members2.has(member));
                    const added_sub_members = Array.from(sub_members2).filter(member => !sub_members1.has(member));
                    
                    if (removed_sub_members.length > 0 || added_sub_members.length > 0) {
                        // Ensure we have the subcluster_changes structure
                        if (!result.cluster_changes[clusterId].subcluster_changes) {
                            result.cluster_changes[clusterId].subcluster_changes = {
                                removed: [],
                                added: [],
                                modified: []
                            };
                        }
                        
                        // Check if this subcluster is already in modified list
                        let existing_modification = result.cluster_changes[clusterId].subcluster_changes.modified.find(
                            mod => mod.subcluster_id === subcluster_id
                        );
                        
                        if (!existing_modification) {
                            existing_modification = {
                                subcluster_id: subcluster_id
                            };
                            result.cluster_changes[clusterId].subcluster_changes.modified.push(existing_modification);
                        }
                        
                        existing_modification.member_changes = {
                            removed: removed_sub_members,
                            added: added_sub_members
                        };
                    }
                }
            }
        } else {
            // This is a new main cluster - check if it has subclusters
            const cluster2 = clusters2[clusterId];
            if (cluster2.childrenCluster && Object.keys(cluster2.childrenCluster).length > 0) {
                            // New main cluster with subclusters
            const subcluster_ids = Object.keys(cluster2.childrenCluster);
            if (!(clusterId in result.cluster_changes)) {
                result.cluster_changes[clusterId] = {};
            }
            result.cluster_changes[clusterId].subcluster_changes = {
                removed: [],
                added: [...new Set(subcluster_ids)],
                modified: []
            };
            
            // Check for member changes in new subclusters
            for (const subcluster_id of subcluster_ids) {
                const subcluster = cluster2.childrenCluster[subcluster_id];
                if (subcluster.member && Object.keys(subcluster.member).length > 0) {
                    // This subcluster has members, so we should track it as a modification
                    if (!result.cluster_changes[clusterId].subcluster_changes.modified) {
                        result.cluster_changes[clusterId].subcluster_changes.modified = [];
                    }
                    
                    result.cluster_changes[clusterId].subcluster_changes.modified.push({
                        subcluster_id: subcluster_id,
                        member_changes: {
                            removed: [],
                            added: Object.keys(subcluster.member)
                        }
                    });
                }
            }
            }
            
            // Also add this new main cluster to added_clusters if it's not already there
            const alreadyAdded = result.added_clusters.some(cluster => cluster.cluster_id === clusterId);
            if (!alreadyAdded) {
                result.added_clusters.push({
                    cluster_id: clusterId,
                    name: cluster2.name || 'Unnamed Cluster'
                });
            }
        }
    }

    // Clean up empty arrays and objects
    const cleaned_result = cleanup_empty_arrays(result);
    
    console.log(`[${current()}]`+ "[spaceComparison] Final compare_clusters result:", JSON.stringify(cleaned_result, null, 2));
    return cleaned_result;
}

function compare_dicts(dict1, dict2) {
	/**
	 * Compare two nested dictionaries and identify all differences.
	 * 
	 * @param {Object} dict1 - First dictionary
	 * @param {Object} dict2 - Second dictionary
	 * @returns {Object} Dictionary with detailed changes
	 */
	// Ensure inputs are objects to avoid Object.keys on null/undefined
	dict1 = dict1 ?? {};
	dict2 = dict2 ?? {};
	
	console.log(`[${current()}]`+ "[compare_dicts] Input dict1:", dict1);
	console.log(`[${current()}]`+ "[compare_dicts] Input dict2:", dict2);
	
	const result: {
		added: { [key: string]: any };
		removed: { [key: string]: any };
		modified: { [key: string]: any };
	} = {
		added: {},
		removed: {},
		modified: {}
	};

	// Get all keys from both dictionaries
	const all_keys = new Set([...Object.keys(dict1), ...Object.keys(dict2)]);
	console.log(`[${current()}]`+ "[compare_dicts] All keys:", Array.from(all_keys));

	for (const key of all_keys) {
		// Check if the key exists in both dictionaries
		if (key in dict1 && key in dict2) {
			console.log(`[${current()}]`+ "[compare_dicts] Key exists in both:", key, "dict1:", dict1[key], "dict2:", dict2[key]);
			// If both are dictionaries, recursively compare them
			if (typeof dict1[key] === 'object' && dict1[key] !== null && 
				typeof dict2[key] === 'object' && dict2[key] !== null &&
				!Array.isArray(dict1[key]) && !Array.isArray(dict2[key])) {
				const sub_result = compare_dicts(dict1[key], dict2[key]);

				// Only add to result if there are actual changes
				if (Object.keys(sub_result.added).length > 0 || 
					Object.keys(sub_result.removed).length > 0 || 
					Object.keys(sub_result.modified).length > 0) {
					result.modified[key] = sub_result;
				}
			}
			// Otherwise compare values directly
			else if (dict1[key] !== dict2[key]) {
				console.log(`[${current()}]`+ "[compare_dicts] Values differ for key:", key, "dict1:", dict1[key], "dict2:", dict2[key]);
				result.modified[key] = {
					old: dict1[key],
					new: dict2[key]
				};
			}
		}
		// Key in dict1 but not in dict2
		else if (key in dict1) {
			console.log(`[${current()}]`+ "[compare_dicts] Key removed:", key, "value:", dict1[key]);
			result.removed[key] = dict1[key];
		}
		// Key in dict2 but not in dict1
		else {
			console.log(`[${current()}]`+ "[compare_dicts] Key added:", key, "value:", dict2[key]);
			result.added[key] = dict2[key];
		}
	}

	// For nested dictionaries, get more specific changes
	for (const key of Object.keys(result.modified)) {
		const dict1Value = dict1[key] || {};
		const dict2Value = dict2[key] || {};
		
		if (typeof dict1Value === 'object' && dict1Value !== null && 
			typeof dict2Value === 'object' && dict2Value !== null &&
			!Array.isArray(dict1Value) && !Array.isArray(dict2Value)) {
			
			const added_items: { [key: string]: any } = {};
			const removed_items: { [key: string]: any } = {};
			const modified_items: { [key: string]: any } = {};

			for (const item_key of Object.keys(dict2Value)) {
				if (!(item_key in dict1Value)) {
					added_items[item_key] = dict2Value[item_key];
				}
			}

			for (const item_key of Object.keys(dict1Value)) {
				if (!(item_key in dict2Value)) {
					removed_items[item_key] = dict1Value[item_key];
				}
				else if (dict1Value[item_key] !== dict2Value[item_key]) {
					modified_items[item_key] = {
						old: dict1Value[item_key],
						new: dict2Value[item_key]
					};
				}
			}

			if (Object.keys(added_items).length > 0 || 
				Object.keys(removed_items).length > 0 || 
				Object.keys(modified_items).length > 0) {
				result.modified[key] = {
					added_items: added_items,
					removed_items: removed_items,
					modified_items: modified_items
				};
			}
		}
	}

	console.log(`[${current()}]`+ "[compare_dicts] Final result:", result);
	return result;
}

function compare_annotations(annotations1, annotations2) {
    /**
     * Compare two annotation dictionaries to find differences in cluster and node annotations.
     * Simplified structure: just track added and removed cluster IDs.
     * 
     * @param {Object} annotations1 - First annotation dictionary
     * @param {Object} annotations2 - Second annotation dictionary
     * @returns {Object} Dictionary with added and removed cluster IDs
     */
    const result: {
        added?: { [key: string]: string[] };
        removed?: { [key: string]: string[] };
    } = {};

    // Normalize inputs
    const ann1 = annotations1 ?? {};
    const ann2 = annotations2 ?? {};

    // Compare cluster annotations
    const clusters1 = ann1.cluster ?? {};
    const clusters2 = ann2.cluster ?? {};
    
    const clusterResult = compare_annotation_arrays(clusters1, clusters2);
    if (Object.keys(clusterResult).length > 0) {
        result.added = clusterResult.added;
        result.removed = clusterResult.removed;
    }
    
    // Compare node annotations
    const nodes1 = ann1.node ?? {};
    const nodes2 = ann2.node ?? {};
    
    const nodeResult = compare_annotation_arrays(nodes1, nodes2);
    if (Object.keys(nodeResult).length > 0) {
        // Merge with existing results
        if (result.added) {
            result.added = { ...result.added, ...nodeResult.added };
        } else if (nodeResult.added) {
            result.added = nodeResult.added;
        }
        
        if (result.removed) {
            result.removed = { ...result.removed, ...nodeResult.removed };
        } else if (nodeResult.removed) {
            result.removed = nodeResult.removed;
        }
    }

    return result;
}

function compare_annotation_arrays(dict1, dict2) {
    /**
     * Compare two dictionaries where values are arrays of strings.
     * Simplified structure: just return added and removed cluster IDs.
     * 
     * @param {Object} dict1 - First dictionary with array values
     * @param {Object} dict2 - Second dictionary with array values
     * @returns {Object} Dictionary with added and removed cluster IDs
     */
    const result: {
        added?: { [key: string]: string[] };
        removed?: { [key: string]: string[] };
    } = {};

    // Get all keys from both dictionaries
    const all_keys = new Set([...Object.keys(dict1), ...Object.keys(dict2)]);

    for (const key of all_keys) {
        if (key in dict1 && key in dict2) {
            // Both exist - compare the arrays
            const array1 = dict1[key] || [];
            const array2 = dict2[key] || [];
            
            // Convert to sets for easier comparison
            const set1 = new Set(array1);
            const set2 = new Set(array2);
            
            // Find added and removed items
            const added = Array.from(set2).filter(item => !set1.has(item));
            const removed = Array.from(set1).filter(item => !set2.has(item));
            
            // Only add to result if there are actual changes
            if (added.length > 0) {
                if (!result.added) result.added = {};
                result.added[key] = added as string[];
            }
            if (removed.length > 0) {
                if (!result.removed) result.removed = {};
                result.removed[key] = removed as string[];
            }
        } else if (key in dict1) {
            // Key exists only in dict1 - it was removed
            if (!result.removed) result.removed = {};
            result.removed[key] = dict1[key] as string[];
        } else {
            // Key exists only in dict2 - it was added
            if (!result.added) result.added = {};
            result.added[key] = dict2[key] as string[];
        }
    }

    return result;
}

function compare_interaction(interaction1, interaction2){
	const result = {
		highlights: {},
		negative_highlights: {},
		annotations: {},
	}

	// Normalize inputs and align key names (singular/plural)
	const i1 = interaction1 ?? {};
	const i2 = interaction2 ?? {};
	const highlights1 = i1.highlight ?? i1.highlights ?? {};
	const highlights2 = i2.highlight ?? i2.highlights ?? {};
	const negative1 = i1.negative_highlight ?? i1.negative_highlights ?? {};
	const negative2 = i2.negative_highlight ?? i2.negative_highlights ?? {};
	const annotations1 = i1.annotation ?? i1.annotations ?? {};
	const annotations2 = i2.annotation ?? i2.annotations ?? {};

	console.log(`[${current()}]`+ "[spaceComparison] interaction1", i1);
	console.log(`[${current()}]`+ "[spaceComparison] interaction2", i2);
	console.log(`[${current()}]`+ "[spaceComparison] highlights1", highlights1);
	console.log(`[${current()}]`+ "[spaceComparison] highlights2", highlights2);
	
	result.highlights = compare_dicts(highlights1, highlights2);
	console.log(`[${current()}]`+ "[spaceComparison] highlights comparison result", result.highlights);
	
	result.negative_highlights = compare_dicts(negative1, negative2);
	console.log(`[${current()}]`+ "[spaceComparison] negative_highlights comparison result", result.negative_highlights);
	
	result.annotations = compare_annotations(annotations1, annotations2);
	console.log(`[${current()}]`+ "[spaceComparison] annotations comparison result", result.annotations);

	// Clean up empty lists and only keep non-empty ones
	// const cleaned_result: {
	// 	highlights?: any;
	// 	negative_highlights?: any;
	// 	annotations?: any;
	// } = {};
    const cleaned_result = {};
    console.log(`[${current()}]`+ "[spaceComparison] result.highlights", result.highlights);
    console.log(`[${current()}]`+ "[spaceComparison] Object.keys(result.highlights).length > 0", Object.keys(result.highlights).length > 0);
    console.log(`[${current()}]`+ "[spaceComparison] result.highlights.added", result.highlights.added);
    console.log(`[${current()}]`+ "[spaceComparison] result.highlights.removed", result.highlights.removed);
    console.log(`[${current()}]`+ "[spaceComparison] result.highlights.modified", result.highlights.modified);
    if (result.highlights && Object.keys(result.highlights).length > 0 && (Object.keys(result.highlights.added).length > 0 || Object.keys(result.highlights.removed).length > 0 || Object.keys(result.highlights.modified).length > 0)){
        const cleaned_highlights = {};
        if (result.highlights.added && Object.keys(result.highlights.added).length > 0){
            cleaned_highlights.added = result.highlights.added;
        }
        if (result.highlights.removed && Object.keys(result.highlights.removed).length > 0){
            cleaned_highlights.removed = result.highlights.removed;
        }
        if (result.highlights.modified && Object.keys(result.highlights.modified).length > 0){
            cleaned_highlights.modified = result.highlights.modified;
        }
        cleaned_result.highlights = cleaned_highlights;
        console.log(`[${current()}]`+ "[spaceComparison] cleaned_highlights", cleaned_highlights);
    }

    if (result.negative_highlights && Object.keys(result.negative_highlights).length > 0 && (Object.keys(result.negative_highlights.added).length > 0 || Object.keys(result.negative_highlights.removed).length > 0 || Object.keys(result.negative_highlights.modified).length > 0)){
        const cleaned_negative_highlights = {};
        if (result.negative_highlights.added && Object.keys(result.negative_highlights.added).length > 0){
            cleaned_negative_highlights.added = result.negative_highlights.added;
        }
        if (result.negative_highlights.removed && Object.keys(result.negative_highlights.removed).length > 0){
            cleaned_negative_highlights.removed = result.negative_highlights.removed;
        }
        if (result.negative_highlights.modified && Object.keys(result.negative_highlights.modified).length > 0){
            cleaned_negative_highlights.modified = result.negative_highlights.modified;
        }
        cleaned_result.negative_highlights = cleaned_negative_highlights;
        console.log(`[${current()}]`+ "[spaceComparison] cleaned_negative_highlights", cleaned_negative_highlights);
    }
	
    if (result.annotations && Object.keys(result.annotations).length > 0){
        cleaned_result.annotations = result.annotations;
    }

	// Helper function to check if a comparison result has any non-empty lists
		return cleaned_result;
}

export function space_comparison(snapshot, previous_snapshot){
    // console.log(`[${current()}]`+ "[spaceComparison] snapshot", snapshot);
    // console.log(`[${current()}]`+ "[spaceComparison] previous_snapshot", previous_snapshot);
    const [previous_doc_structure, previous_human_interation, previous_hierarchicalStructure] = snapshot_distill(previous_snapshot) || [];
    const [doc_structure, human_interation, hierarchicalStructure] = snapshot_distill(snapshot) || [];
    console.log(`[${current()}]`+ "[spaceComparison] previous_doc_structure", previous_doc_structure);
    console.log(`[${current()}]`+ "[spaceComparison] doc_structure", doc_structure);

    const doc_structure_diff = compare_clusters(previous_doc_structure, doc_structure);
    const human_interation_diff = compare_interaction(previous_human_interation,human_interation);
    console.log(`[${current()}]`+ "[spaceComparison] human_interation_diff", human_interation_diff);

    return [doc_structure, doc_structure_diff, human_interation, human_interation_diff, hierarchicalStructure];
}