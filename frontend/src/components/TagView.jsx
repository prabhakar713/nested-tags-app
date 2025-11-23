import React, { useState, useEffect } from "react";

/**
 * Controlled recursive TagView.
 * Props:
 * - node: { name, children? (array) | data? (string) }
 * - onChange(newNode) : called when this node or any descendant changes
 */
export default function TagView({ node, onChange }) {
    // local UI-only state
    const [collapsed, setCollapsed] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(node?.name || "");

    // Sync nameInput with node.name when node changes
    useEffect(() => {
        setNameInput(node?.name || "");
    }, [node.name]);

    // Helpers: produce a shallow copy and apply updates
    const copyNode = () => JSON.parse(JSON.stringify(node || { name: "unnamed", data: "" }));

    const setNode = (updater) => {
        // updater can be object or function(node)->newNode
        const next = typeof updater === "function" ? updater(copyNode()) : updater;
        onChange(next);
    };

    const toggleCollapsed = () => setCollapsed((c) => !c);

    const handleAddChild = () => {
        // Create new child node
        const newChild = { name: "New Child", data: "Data" };
        if ("data" in node) {
            // convert leaf to parent
            const newNode = { name: node.name, children: [newChild] };
            onChange(newNode);
        } else {
            const newChildren = Array.isArray(node.children) ? [...node.children, newChild] : [newChild];
            const newNode = { ...node, children: newChildren };
            onChange(newNode);
        }
    };

    const handleDataChange = (ev) => {
        setNode((n) => {
            n.data = ev.target.value;
            return n;
        });
    };

    const handleChildUpdate = (index, updatedChild) => {
        setNode((n) => {
            const children = Array.isArray(n.children) ? [...n.children] : [];
            children[index] = updatedChild;
            n.children = children;
            // if children becomes empty you could convert to data - leave as empty children
            return n;
        });
    };

    const handleDeleteChild = (index) => {
        setNode((n) => {
            const children = [...(n.children || [])];
            children.splice(index, 1);
            if (children.length === 0) {
                // convert to a default data leaf when no children remain
                return { name: n.name, data: "Data" };
            }
            n.children = children;
            return n;
        });
    };

    const submitName = () => {
        const newName = (nameInput || "").trim() || "Unnamed";
        setNode((n) => {
            n.name = newName;
            return n;
        });
        setEditingName(false);
    };

    const onNameKey = (e) => {
        if (e.key === "Enter") submitName();
        if (e.key === "Escape") setEditingName(false);
    };

    // Determine if leaf
    const isLeaf = "data" in node && typeof node.data !== "undefined";

    return (
        <div className="tag-wrapper">
            <div className="tag-header">
                <button className="collapse-btn" onClick={toggleCollapsed}>
                    {collapsed ? ">" : "v"}
                </button>

                <div className="tag-name">
                    {editingName ? (
                        <input
                            className="name-input"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={onNameKey}
                            onBlur={submitName}
                            autoFocus
                        />
                    ) : (
                        <div onClick={() => { setNameInput(node.name); setEditingName(true); }} className="name-text">
                            {node.name}
                        </div>
                    )}
                </div>

                <div className="tag-actions">
                    <button className="btn small" onClick={handleAddChild}>Add Child</button>
                </div>
            </div>

            {!collapsed && (
                <div className="tag-body">
                    {isLeaf ? (
                        <div className="data-row">
                            <label className="data-label">Data</label>
                            <input
                                className="data-input"
                                value={node.data || ""}
                                onChange={handleDataChange}
                                placeholder="Data"
                            />
                        </div>
                    ) : (
                        <div className="children-list">
                            {Array.isArray(node.children) && node.children.map((child, i) => (
                                <div key={i} className="child-card">
                                    <div className="child-controls">
                                        <button className="btn tiny" onClick={() => handleDeleteChild(i)}>Delete</button>
                                    </div>
                                    <TagView
                                        node={child}
                                        onChange={(updatedChild) => handleChildUpdate(i, updatedChild)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
