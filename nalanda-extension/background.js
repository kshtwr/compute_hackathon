import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SAVE_ANNOTATION') {
        handleSaveAnnotation(request.payload)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Indicates we will send a response asynchronously
    }

    if (request.action === 'GET_ANNOTATIONS') {
        handleGetAnnotations(request.payload.url)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true;
    }

    if (request.action === 'UPDATE_ANNOTATION') {
        handleUpdateAnnotation(request.payload.id, request.payload.position)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true;
    }
});

async function handleSaveAnnotation(payload) {
    // Basic user session handling (for MVP, we assume a single "guest" user or generate a UUID)
    // In a real app, this would tie into Chrome identity or Supabase Auth.
    const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'; // We'll need to create this user in the DB

    // 1. Ensure the mock user exists (Hackathon shortcut)
    await ensureUserExists(MOCK_USER_ID);

    // 2. Insert the annotation
    const { data: annotation, error } = await supabase
        .from('annotations')
        .insert([{
            id: crypto.randomUUID(),
            user_id: MOCK_USER_ID,
            website_url: payload.website_url,
            page_title: payload.page_title,
            annotation_type: payload.annotation_type,
            highlighted_text: payload.highlighted_text,
            sticky_note_content: payload.sticky_note_content,
            position: payload.position,
            color: payload.color,
            timestamp: new Date().toISOString(),
            // AI Category can be added via a DB trigger or Edge Function later
        }])
        .select()
        .single();

    if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
    }

    return annotation;
}

async function ensureUserExists(userId) {
    // Check if user exists, if not create them.
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

    if (error && error.code === 'PGRST116') { // PGRST116 = no rows returned
        await supabase.from('users').insert([{
            id: userId,
            email: 'guest@nalanda.app',
            created_at: new Date().toISOString()
        }]);
    }
}

async function handleGetAnnotations(url) {
    const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .eq('website_url', url);

    if (error) {
        console.error('Supabase Fetch Error:', error);
        throw error;
    }

    return data;
}

async function handleUpdateAnnotation(id, position) {
    const { data, error } = await supabase
        .from('annotations')
        .update({ position: position })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Supabase Update Error:', error);
        throw error;
    }

    return data;
}
