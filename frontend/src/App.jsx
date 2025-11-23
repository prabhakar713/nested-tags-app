import React, { useState, useEffect } from 'react'
import TagView from './components/TagView'

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/trees'

function prune(node) {
    const out = { name: node.name };
    if (Array.isArray(node.children) && node.children.length) {
        out.children = node.children.map(prune);
    } else if (typeof node.data === "string") {
        out.data = node.data;
    }
    return out;
}

export default function App() {
    const [trees, setTrees] = useState([]); // { id, tree }
    const [loading, setLoading] = useState(true);
    const [jsonOutputMap, setJsonOutputMap] = useState({}); // id -> json string

    const fetchTrees = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}`);
            const data = await res.json();
            // backend returns { id, data }
            const mapped = data.map((r) => ({
                id: r.id,
                tree: r.data,
            }));
            setTrees(mapped);
        } catch (err) {
            console.error("Failed to fetch trees", err);
            setTrees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrees();
    }, []);

    // Update tree in local state
    function updateLocalTree(idx, newTree) {
        setTrees((prev) => {
            const cp = [...prev];
            cp[idx] = { ...cp[idx], tree: newTree };
            return cp;
        });
    }

    // Create new local tree (unsaved)
    function createNewLocalTree() {
        setTrees((prev) => [
            ...prev,
            {
                id: null,
                tree: { name: "root", children: [] },
            },
        ]);
    }

    async function saveTreeToServer(idx) {
        const rec = trees[idx];
        const payload = { data: prune(rec.tree) };
        try {
            if (rec.id) {
                // update
                const res = await fetch(`${API_URL}/${rec.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to update");
                const updated = await res.json();
                updateLocalTree(idx, updated.data);
                setTrees((prev) => {
                    const cp = [...prev];
                    cp[idx] = { ...cp[idx], id: updated.id, tree: updated.data };
                    return cp;
                });
                alert("Tree updated on server");
            } else {
                // create
                const res = await fetch(`${API_URL}` , {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to create");
                const created = await res.json();
                setTrees((prev) => {
                    const cp = [...prev];
                    cp[idx] = { ...cp[idx], id: created.id, tree: created.data };
                    return cp;
                });
                alert("Tree saved to server");
            }
        } catch (e) {
            console.error(e);
            alert("Save failed: " + (e.message || e));
        }
    }

    function exportTreeToJson(idx) {
        const json = JSON.stringify(prune(trees[idx].tree), null, 2);
        setJsonOutputMap((m) => ({ ...m, [idx]: json }));
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Nested Tags Tree Editor</h1>
                <div>
                    <button className="btn primary" onClick={createNewLocalTree}>
                        New Local Tree
                    </button>
                </div>
            </header>

            {loading && <div className="card">Loading trees...</div>}

            {!loading && trees.length === 0 && (
                <div className="card">
                    <p>No saved trees found. Click <b>New Local Tree</b> to start.</p>
                </div>
            )}

            {trees.map((rec, idx) => (
                <div key={idx} className="card tree-card">
                    <div className="tree-header">
                        <div className="tree-title">
                            <strong>Tree {rec.id ? rec.id : '(unsaved)'}</strong>
                        </div>
                        <div className="tree-actions">
                            <button className="btn" onClick={() => exportTreeToJson(idx)}>Export</button>
                            <button className="btn success" onClick={() => saveTreeToServer(idx)}>Save</button>
                        </div>
                    </div>

                    <div className="tree-body">
                        {/* TagView is controlled: node=rec.tree, onChange will update local state */}
                        <TagView
                            node={rec.tree}
                            onChange={(newNode) => updateLocalTree(idx, newNode)}
                        />
                    </div>

                    {jsonOutputMap[idx] && (
                        <pre className="json-output">{jsonOutputMap[idx]}</pre>
                    )}
                </div>
            ))}
        </div>
    );
}