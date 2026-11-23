// buildClusterStructures.js
// Utility to build hierarchical cluster structures for report generation and other plugins

export function buildClusterStructures(sorted_dict, data, current) {
    // Build hierarchical structure and get all file members for clusters with subclusters
    const hierarchicalStructure = {};
    const clusterWithAllMembers = {};

    // First pass: build hierarchical structure and identify main clusters (parent is page:page)
    for (const key in sorted_dict) {
        if (data[key] && data[key].parentId === "page:page") {
            hierarchicalStructure[key] = {
                name: sorted_dict[key].name,
                children: [],
            };
        }
    }

    // Second pass: establish parent-child relationships
    for (const key in sorted_dict) {
        const frame = sorted_dict[key];
        for (const otherKey in sorted_dict) {
            if (key !== otherKey) {
                // Check if this frame is contained within another frame
                if (frame.parentId === otherKey) {
                    if (otherKey in hierarchicalStructure){
                        hierarchicalStructure[otherKey].children.push(key);
                    }else{
                        hierarchicalStructure[otherKey] = {
                            name: sorted_dict[otherKey]? sorted_dict[otherKey].name: "",
                            children: [key],
                        };
                    }
                }
            }
        }
    }
    if (typeof current === 'function') {
        console.log(`[${current()}]`+ "[buildClusterStructures] hierarchicalStructure", hierarchicalStructure);
    }

    // Third pass: get all file members for clusters with subclusters
    for (const key in sorted_dict) {
        // Only process clusters that exist in hierarchicalStructure (main clusters)
        if(key in hierarchicalStructure) {
            if (typeof current === 'function') {
                console.log(`[${current()}]`+ "[buildClusterStructures] key", key);
            }
            clusterWithAllMembers[key] = {
                name: sorted_dict[key].name,
                member: { ...sorted_dict[key].text } // Start with direct members
            };

            // Recursively get all members from subclusters
            function getAllMembersFromChildren(clusterId) {
                const children = hierarchicalStructure[clusterId].children;
                for (const childId of children) {
                    // Add direct members from child
                    for (const textId in sorted_dict[childId].text) {
                        clusterWithAllMembers[key].member[textId] = sorted_dict[childId].text[textId];
                    }
                    // Recursively get members from grandchildren
                    // getAllMembersFromChildren(childId);
                }
            }

            getAllMembersFromChildren(key);
        }
    }

    // Fourth pass: ensure main clusters (with parent page:page) include all files from their subclusters
    for (const key in sorted_dict) {
        if(key in hierarchicalStructure){
            // For main clusters, make sure they include all files from their entire subtree
            const allMembers = {};

            // Function to recursively collect all members from this cluster and all its descendants
            function collectAllMembersFromCluster(clusterId) {
                // Add direct members from this cluster
                for (const textId in sorted_dict[clusterId].text) {
                    allMembers[textId] = sorted_dict[clusterId].text[textId];
                }

                // Recursively add members from all children
                const children = hierarchicalStructure[clusterId].children;
                for (const childId of children) {
                    if (childId in sorted_dict){
                        for (const textId in sorted_dict[childId].text){
                            allMembers[textId] = sorted_dict[childId].text[textId];
                        }
                    }
                }
            }

            collectAllMembersFromCluster(key);
            clusterWithAllMembers[key].member = allMembers;
        }else{
            clusterWithAllMembers[key] = {
                name: sorted_dict[key].name,
                member: { ...sorted_dict[key].text } // Start with direct members
            };
        }
    }

    if (typeof current === 'function') {
        console.log(`[${current()}]`+ "[buildClusterStructures] hierarchicalStructure", hierarchicalStructure);
        console.log(`[${current()}]`+ "[buildClusterStructures] clusterWithAllMembers", clusterWithAllMembers);
    }

    const clusters_v2 = {};
    for (const key in clusterWithAllMembers){
        if (clusterWithAllMembers[key].member){
            clusters_v2[key] = {};
            clusters_v2[key].name = sorted_dict[key].name;
            clusters_v2[key].member = {};
            for (const id in clusterWithAllMembers[key].member){
                clusters_v2[key].member[clusterWithAllMembers[key].member[id].label] = clusterWithAllMembers[key].member[id].content;
            }
        }
    }
    if (typeof current === 'function') {
        console.log(`[${current()}]`+ "[buildClusterStructures] clusters_v2", clusters_v2);
    }

    return { hierarchicalStructure, clusterWithAllMembers, clusters_v2 };
} 