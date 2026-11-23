export async function reportToClusterName (editor, oriReport) {
    const snapshot = editor.store.getSnapshot().store;
    const report = JSON.parse(oriReport);
    for (var item in report["Middle_paragraph"]){
        let middle = {};
        const id = report["Middle_paragraph"][item]["id"]
        if (id.includes("shape") && snapshot[id]){
            const props = snapshot[id].props;
            console.log("props", props.name);
            if (props.name===""){
                middle["id"] = id;
                middle["name"] = report["Middle_paragraph"][item]["name"];
                editor.updateShape(
                    {
                        id: id, 
                        type: "frame",
                        props: {
                            ...props, 
                            name: middle["name"]
                        }
                    }
                )
            }
            console.log("[reportToClusterName] item", report["Middle_paragraph"][item]);
            console.log("[reportToClusterName] item.subclusters", report["Middle_paragraph"][item].subclusters);
            if (report["Middle_paragraph"][item].subclusters){
                for (var subcluster in report["Middle_paragraph"][item].subclusters){
                    const subclusterId = subcluster;
                    console.log("[reportToClusterName] subclusterId", subclusterId);
                    console.log("[reportToClusterName] snapshot[subclusterId]", snapshot[subclusterId]);
                    if (subclusterId.includes("shape") && snapshot[subclusterId]){
                        const subclusterProps = snapshot[subclusterId].props;
                        const subclusterName = report["Middle_paragraph"][item].subclusters[subcluster]["name"];
                        console.log("[reportToClusterName] subclusterName", subclusterName);
                        if (subclusterProps.name===""){
                            // subclusterProps.name = subcluster["name"];
                            editor.updateShape(
                                {
                                    id: subclusterId, 
                                    type: "frame",
                                    props: {
                                        ...subclusterProps, 
                                        name: subclusterName
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

}
