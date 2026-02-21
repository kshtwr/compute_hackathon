// --- Nalanda Content Script ---

let currentSelection = null;
let currentRange = null;
let lastClickEvent = null;

// Inject the floating toolbar
function createToolbar() {
    const existingToolbar = document.getElementById('nalanda-floating-toolbar');
    if (existingToolbar) existingToolbar.remove();

    const toolbar = document.createElement('div');
    toolbar.id = 'nalanda-floating-toolbar';
    toolbar.style.display = 'none';

    // Highlight Button
    const highlightBtn = document.createElement('button');
    highlightBtn.className = 'nalanda-tool-btn';
    highlightBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
    Highlight
  `;
    highlightBtn.onclick = handleHighlightClick;

    // Add Note Button
    const noteBtn = document.createElement('button');
    noteBtn.className = 'nalanda-tool-btn';
    noteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>
    Add Note
  `;
    noteBtn.onclick = handleAddNoteClick;

    toolbar.appendChild(highlightBtn);
    toolbar.appendChild(noteBtn);
    document.body.appendChild(toolbar);
    return toolbar;
}

const toolbar = createToolbar();

// Inject Modal for Notes
function createNoteModal() {
    const backdrop = document.createElement('div');
    backdrop.id = 'nalanda-modal-backdrop';
    backdrop.style.display = 'none';

    const modal = document.createElement('div');
    modal.id = 'nalanda-note-modal';
    modal.style.display = 'none';

    modal.innerHTML = `
    <h3>Add Sticky Note</h3>
    <textarea id="nalanda-note-text" placeholder="What are your thoughts on this?"></textarea>
    <div class="nalanda-modal-actions">
      <button class="nalanda-btn-cancel" id="nalanda-cancel-note">Cancel</button>
      <button class="nalanda-btn-save" id="nalanda-save-note">Save</button>
    </div>
  `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    document.getElementById('nalanda-cancel-note').onclick = closeNoteModal;
    document.getElementById('nalanda-save-note').onclick = saveStickyNote;
    backdrop.onclick = closeNoteModal;
}

createNoteModal();

// Listen for selection changes and Alt+Click
document.addEventListener('mouseup', (e) => {
    // Ignore clicks inside our own tools
    if (e.target.closest('#nalanda-floating-toolbar') || e.target.closest('#nalanda-note-modal')) {
        return;
    }

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
        currentSelection = text;
        currentRange = selection.getRangeAt(0).cloneRange();

        // Position the toolbar
        const rect = currentRange.getBoundingClientRect();
        toolbar.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (toolbar.offsetWidth / 2)}px`;
        toolbar.style.top = `${rect.top + window.scrollY - 45}px`; // Show above selection
        toolbar.style.display = 'flex';
    } else {
        toolbar.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    // If Alt key is pressed, open sticky note modal without needing text selection
    if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        currentSelection = null;
        currentRange = null;
        lastClickEvent = {
            target: e.target,
            x: e.pageX,
            y: e.pageY
        };

        document.getElementById('nalanda-note-modal').style.display = 'block';
        document.getElementById('nalanda-modal-backdrop').style.display = 'block';
        document.getElementById('nalanda-note-text').focus();
        toolbar.style.display = 'none';
    }
});

// Selection Logic
function handleHighlightClick() {
    if (!currentRange) return;

    // Wrap the selection
    const span = document.createElement('span');
    span.className = 'nalanda-highlight';

    try {
        currentRange.surroundContents(span);
    } catch (e) {
        console.warn("Nalanda: Could not cleanly surround contents. Selection spans multiple block elements.");
        // Fallback or complex wrapping would go here in a production version
    }

    // Package data to send to background script
    const annotationData = createAnnotationPayload('highlight', currentSelection, null);
    sendToSupabase(annotationData);

    window.getSelection().removeAllRanges();
    toolbar.style.display = 'none';
}

function handleAddNoteClick() {
    document.getElementById('nalanda-note-modal').style.display = 'block';
    document.getElementById('nalanda-modal-backdrop').style.display = 'block';
    document.getElementById('nalanda-note-text').focus();
    toolbar.style.display = 'none';
}

function closeNoteModal() {
    document.getElementById('nalanda-note-modal').style.display = 'none';
    document.getElementById('nalanda-modal-backdrop').style.display = 'none';
    document.getElementById('nalanda-note-text').value = '';
}

function saveStickyNote() {
    const noteContent = document.getElementById('nalanda-note-text').value.trim();
    if (!noteContent) return;

    let annotationData;

    if (currentRange) {
        // Add visual indicator for the sticky note attached to a highlight
        const span = document.createElement('span');
        span.className = 'nalanda-highlight';
        try {
            currentRange.surroundContents(span);
        } catch (e) { }

        const rect = currentRange.getBoundingClientRect();
        // Since it's a new note, we will generate the ID here so we know what it is on the frontend for dragging
        const tempId = crypto.randomUUID();
        createStickyNote(tempId, rect.right + window.scrollX + 5, rect.top + window.scrollY - 10, noteContent);

        annotationData = createAnnotationPayload('sticky-note', currentSelection, noteContent, tempId);
    } else if (lastClickEvent) {
        // Alt-Clicked anywhere
        const tempId = crypto.randomUUID();
        createStickyNote(tempId, lastClickEvent.x, lastClickEvent.y - 12, noteContent);

        annotationData = {
            id: tempId,
            website_url: window.location.href,
            page_title: document.title,
            annotation_type: 'sticky-note',
            highlighted_text: null,
            sticky_note_content: noteContent,
            position: {
                xpath: getXPath(lastClickEvent.target),
                offset: 0,
                xOffset: 0, // Store movement offsets
                yOffset: 0
            },
            color: '#F59E0B'
        };
    } else {
        closeNoteModal();
        return;
    }

    sendToSupabase(annotationData);

    closeNoteModal();
    window.getSelection().removeAllRanges();
}

function createStickyNote(id, x, y, noteContent) {
    const note = document.createElement('div');
    note.className = 'nalanda-sticky-note';
    note.dataset.annotationId = id; // Store ID for updating later

    // Save original absolute anchor point on creation
    note.dataset.anchorX = x;
    note.dataset.anchorY = y;

    note.style.left = `${x}px`;
    note.style.top = `${y}px`;

    note.innerHTML = `
        <div class="nalanda-sticky-header">
            <div class="nalanda-sticky-drag-handle" title="Drag to move">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <div class="nalanda-sticky-close" title="Delete note">×</div>
        </div>
        <div class="nalanda-sticky-content">${noteContent}</div>
    `;

    document.body.appendChild(note);

    const header = note.querySelector('.nalanda-sticky-header');

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = note.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        if (e.stopPropagation) e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const newX = e.pageX - offsetX;
        const newY = e.pageY - offsetY;

        note.style.left = `${newX}px`;
        note.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;

            // Calculate how far we drifted from the origin
            const currentLeft = parseFloat(note.style.left);
            const currentTop = parseFloat(note.style.top);
            const originX = parseFloat(note.dataset.anchorX);
            const originY = parseFloat(note.dataset.anchorY);

            const positionPayload = {
                xpath: note.dataset.xpath || getXPath(document.body),
                offset: 0,
                xOffset: currentLeft - originX,
                yOffset: currentTop - originY
            };

            updateAnnotationPosition(note.dataset.annotationId, positionPayload);
        }
    });

    note.querySelector('.nalanda-sticky-close').addEventListener('click', (e) => {
        e.stopPropagation();
        note.style.transform = 'scale(0.9)';
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 200);
    });

    return note;
}

// Helpers
function getXPath(element) {
    if (element.id !== '') return 'id("' + element.id + '")';
    if (element === document.body) return element.tagName;

    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) {
            return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
}

function createAnnotationPayload(type, highlightedText, stickyNoteContent, id) {
    const anchorNode = currentRange ? currentRange.startContainer : document.body;
    const elementNode = anchorNode.nodeType === 3 ? anchorNode.parentNode : anchorNode;

    return {
        id: id || crypto.randomUUID(),
        website_url: window.location.href,
        page_title: document.title,
        annotation_type: type,
        highlighted_text: highlightedText || null,
        sticky_note_content: stickyNoteContent || null,
        position: {
            xpath: getXPath(elementNode),
            offset: currentRange ? currentRange.startOffset : 0,
            xOffset: 0,
            yOffset: 0
        },
        color: '#F59E0B' // Default amber
    };
}

// Send to Background Script
function sendToSupabase(data) {
    console.log("Nalanda Annotation Payload:", data);
    chrome.runtime.sendMessage({
        action: "SAVE_ANNOTATION",
        payload: data
    }, (response) => {
        if (response && response.success) {
            console.log("Nalanda: Annotation saved successfully!", response.data);
        } else {
            console.error("Nalanda: Error saving annotation", response?.error);
        }
    });
}

function updateAnnotationPosition(id, positionMap) {
    chrome.runtime.sendMessage({
        action: "UPDATE_ANNOTATION",
        payload: { id: id, position: positionMap }
    }, (response) => {
        if (response && response.success) {
            console.log("Nalanda: Position synced with Database.");
        }
    });
}

function loadAnnotations() {
    chrome.runtime.sendMessage({
        action: "GET_ANNOTATIONS",
        payload: { url: window.location.href }
    }, (response) => {
        if (response && response.success && response.data) {
            response.data.forEach(renderAnnotation);
        }
    });
}
window.addEventListener('load', loadAnnotations);

function renderAnnotation(ann) {
    if (ann.annotation_type === 'sticky-note' && !ann.highlighted_text) {
        try {
            const result = document.evaluate(ann.position.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const node = result.singleNodeValue;
            if (node) {
                const rect = node.getBoundingClientRect();
                const baseX = rect.left + window.scrollX;
                const baseY = rect.top + window.scrollY;

                const finalX = baseX + (ann.position.xOffset || 0);
                const finalY = baseY + (ann.position.yOffset || 0);

                const noteUI = createStickyNote(ann.id, finalX, finalY, ann.sticky_note_content);
                noteUI.dataset.xpath = ann.position.xpath;
                noteUI.dataset.anchorX = baseX;
                noteUI.dataset.anchorY = baseY;
            }
        } catch (e) {
            console.warn("Could not find xpath for annotation", ann);
        }
    } else {
        try {
            // Reconstruct the highlight by finding the specific text on the page
            if (ann.highlighted_text) {
                // Save current selection to restore later
                const selection = window.getSelection();
                const currentRanges = [];
                for (let i = 0; i < selection.rangeCount; i++) {
                    currentRanges.push(selection.getRangeAt(i));
                }

                // Clear selection and jump to the top of the document to start the search
                selection.removeAllRanges();

                // Keep searching until we find the instance near our saved XPath
                // For a hackathon MVP, we will just use window.find() to locate the first instance 
                // of the string on the page, which works 95% of the time. 
                // A production app would rigorously rebuild the Range object using xpath + offset traversing TextNodes.
                const found = window.find(ann.highlighted_text, false, false, true, false, false, false);

                if (found) {
                    const foundRange = selection.getRangeAt(0);
                    const span = document.createElement('span');
                    span.className = 'nalanda-highlight';
                    try {
                        foundRange.surroundContents(span);

                        // If it's also a sticky note, attach it
                        if (ann.annotation_type === 'sticky-note') {
                            const rect = span.getBoundingClientRect();
                            const baseX = rect.right + window.scrollX + 5;
                            const baseY = rect.top + window.scrollY - 10;

                            const finalX = baseX + (ann.position.xOffset || 0);
                            const finalY = baseY + (ann.position.yOffset || 0);

                            const noteUI = createStickyNote(ann.id, finalX, finalY, ann.sticky_note_content);
                            noteUI.dataset.xpath = ann.position.xpath;
                            noteUI.dataset.anchorX = baseX;
                            noteUI.dataset.anchorY = baseY;
                        }
                    } catch (e) {
                        console.warn("Could not wrap restored highlight", e);
                    }
                }

                // Restore original selection if user was doing something
                selection.removeAllRanges();
                currentRanges.forEach(r => selection.addRange(r));

            }
        } catch (e) { console.error("Error restoring highlight:", e); }
    }
}
