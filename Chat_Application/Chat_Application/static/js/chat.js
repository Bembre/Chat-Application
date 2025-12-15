// Chat Application JavaScript

// Global variables - initialized from Django template
let API_BASE, MEDIA_URL, currentUserId, users, groups, messagesCache;
let contactsList, groupList, chatSection, chatTitle, chatSubtitle;
let messageForm, messageInput, sendBtn, typingIndicator, downloadCsvBtn;
let reactionOptions, activeConversation, groupForm, groupMembersContainer;
let groupNameInput, currentEditId, loginModal, signupModal;
let attachmentPreview = null;
let currentAttachment = null;

// Initialize variables from DOM
function initializeVars() {
    contactsList = document.getElementById('list');
    groupList = document.getElementById('groupList');
    chatSection = document.getElementById('chat_section');
    chatTitle = document.getElementById('chatTitle');
    chatSubtitle = document.getElementById('chatSubtitle');
    messageForm = document.getElementById('messageForm');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    typingIndicator = document.getElementById('typingIndicator');
    downloadCsvBtn = document.getElementById('downloadCsvBtn');
    reactionOptions = ['❤️','😂','👍','🎉','🙏','😮'];
    activeConversation = null;
    groupForm = document.getElementById('groupForm');
    groupMembersContainer = document.getElementById('groupMembers');
    groupNameInput = document.getElementById('groupName');
    currentEditId = null;
    messagesCache = {};
    
    const loginModalEl = document.getElementById('loginModal');
    const signupModalEl = document.getElementById('signupModal');
    if (loginModalEl) loginModal = new bootstrap.Modal(loginModalEl);
    if (signupModalEl) signupModal = new bootstrap.Modal(signupModalEl);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getCSRFToken() {
    return getCookie('csrftoken');
}

async function api(path, options = {}) {
    const headers = {
        'X-CSRFToken': getCSRFToken()
    };
    
    // For file uploads, don't set Content-Type (let browser set it with boundary)
    if (!options.isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    
    // Include JWT token if available (for backward compatibility)
    const token = localStorage.getItem('access');
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    Object.assign(headers, options.headers || {});
    
    const res = await fetch(path, Object.assign(options, { 
        headers,
        credentials: 'same-origin'
    }));
    
    if (res.status === 401) {
        window.location.href = '/?logout=1';
        throw new Error('Unauthorized');
    }
    if (options.responseType === 'blob') return res;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
}

function displayName(u) {
    return u.name || u.email || ('User ' + u.id);
}

function getProfilePhotoUrl(user) {
    if (user.profile_photo) {
        const photo = user.profile_photo;
        if (photo.startsWith('http://') || photo.startsWith('https://')) {
            return photo;
        }
        if (photo.startsWith('/media/')) {
            return photo;
        }
        return MEDIA_URL + photo;
    }
    return null;
}

function renderAvatar(avatarEl, user) {
    const photoUrl = getProfilePhotoUrl(user);
    if (photoUrl) {
        avatarEl.innerHTML = '<img src="' + photoUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="' + displayName(user) + '">';
    } else {
        avatarEl.textContent = (displayName(user) || '?').charAt(0).toUpperCase();
    }
}

function bootstrapApp() {
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    if (isAuthenticated) {
        const greeting = document.getElementById('userGreeting');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        if (greeting) greeting.textContent = 'Hello, ' + (document.body.dataset.userName || 'User');
        if (logoutBtn) logoutBtn.classList.remove('d-none');
        if (loginBtn) loginBtn.classList.add('d-none');
        if (signupBtn) signupBtn.classList.add('d-none');
        renderContacts();
        renderGroups();
        renderGroupMembers();
    } else {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (loginBtn) loginBtn.classList.remove('d-none');
        if (signupBtn) signupBtn.classList.remove('d-none');
        if (logoutBtn) logoutBtn.classList.add('d-none');
        if (loginModal) loginModal.show();
    }
}

async function loadMessages(conversation) {
    if (!conversation) return;
    const key = conversation.type === 'user' ? `user-${conversation.id}` : `group-${conversation.id}`;
    let url = API_BASE + 'messages/?';
    url += conversation.type === 'user' ? 'user_id=' + conversation.id : 'group_id=' + conversation.id;
    try {
        const data = await api(url);
        messagesCache[key] = data;
        renderMessages(conversation);
    } catch (e) {
        console.error('Error loading messages:', e);
    }
}

function renderContacts() {
    if (!contactsList) return;
    contactsList.innerHTML = '';
    users.forEach(user => {
        const button = document.createElement('button');
        button.className = 'list-group-item list-group-item-action d-flex align-items-center justify-content-between contact-btn';
        let infoWrap = document.createElement('div');
        infoWrap.className = 'd-flex align-items-center';
        let avatar = document.createElement('div');
        avatar.className = 'avatar';
        renderAvatar(avatar, user);
        let nameEl = document.createElement('span');
        nameEl.textContent = displayName(user);
        infoWrap.appendChild(avatar);
        infoWrap.appendChild(nameEl);

        button.appendChild(infoWrap);

        button.dataset.contactId = user.id;
        button.dataset.type = 'user';
        button.addEventListener('click', function () {
            setActiveConversation({ type: 'user', id: user.id });
            loadMessages({ type: 'user', id: user.id });
        });
        contactsList.appendChild(button);
    });
}

async function loadGroups() {
    try {
        const data = await api(API_BASE + 'groups/');
        groups = data;
        renderGroups();
    } catch (e) {
        console.error('Error loading groups:', e);
    }
}

function renderGroups() {
    if (!groupList) return;
    groupList.innerHTML = '';
    groups.forEach(function (group) {
        let button = document.createElement('button');
        button.className = 'list-group-item list-group-item-action d-flex align-items-center justify-content-between contact-btn';
        let infoWrap = document.createElement('div');
        infoWrap.className = 'd-flex align-items-center';
        let avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = group.name.charAt(0).toUpperCase();
        let nameEl = document.createElement('span');
        nameEl.textContent = group.name + ' (Group)';
        infoWrap.appendChild(avatar);
        infoWrap.appendChild(nameEl);

        let statusWrap = document.createElement('span');
        statusWrap.className = 'text-muted small';
        const memberCount = (group.members && Array.isArray(group.members)) ? group.members.length : 0;
        statusWrap.textContent = memberCount + ' members';

        button.appendChild(infoWrap);
        button.appendChild(statusWrap);

        button.dataset.groupId = group.id;
        button.dataset.type = 'group';
        button.addEventListener('click', function () {
            setActiveConversation({ type: 'group', id: group.id });
            loadMessages({ type: 'group', id: group.id });
        });
        groupList.appendChild(button);
    });
}

function setActiveConversation(conv) {
    activeConversation = conv;
    var buttons = document.querySelectorAll('.contact-btn');
    buttons.forEach(btn => {
        var type = btn.dataset.type;
        var id = type === 'group' ? btn.dataset.groupId : btn.dataset.contactId;
        if (conv && conv.type === type && String(conv.id) === String(id)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    currentEditId = null;
    if (sendBtn) sendBtn.innerHTML = '<span class="me-1">➤</span>Send';
    if (messageInput) messageInput.value = '';
    clearAttachmentPreview();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📄',
        'xls': '📊', 'xlsx': '📊', 'csv': '📊',
        'zip': '📦', 'rar': '📦', '7z': '📦',
        'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️'
    };
    return iconMap[ext] || '📎';
}

function renderAttachment(message) {
    if (!message.attachment_url) return '';
    
    const fileName = message.file_name || 'attachment';
    const attachmentUrl = message.attachment_url;
    const isImage = message.is_image || false;
    const isVideo = message.is_video || false;
    
    let previewHtml = '';
    if (isImage) {
        previewHtml = `<img src="${attachmentUrl}" class="attachment-thumbnail" alt="${escapeHtml(fileName)}" style="max-width:100%;max-height:200px;border-radius:8px;">`;
    } else if (isVideo) {
        previewHtml = `<video controls class="attachment-thumbnail" style="max-width:100%;max-height:200px;border-radius:8px;"><source src="${attachmentUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
    } else {
        previewHtml = `<div class="attachment-icon" style="font-size:2rem;">${getFileIcon(fileName)}</div>`;
    }
    
    return `
        <div class="attachment-container">
            ${previewHtml}
            <div class="attachment-info">
                <div class="attachment-name">${escapeHtml(fileName)}</div>
            </div>
            <div class="attachment-actions">
                <button class="btn btn-sm btn-outline-primary btn-open" onclick="openAttachment('${attachmentUrl}')">Open</button>
                <button class="btn btn-sm btn-outline-secondary btn-download" onclick="downloadAttachment('${attachmentUrl}', '${escapeHtml(fileName)}')">Download</button>
            </div>
        </div>
    `;
}

window.openAttachment = function(url) {
    window.open(url, '_blank');
};

window.downloadAttachment = function(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function renderMessages(conversation) {
    const key = conversation.type === 'user' ? `user-${conversation.id}` : `group-${conversation.id}`;
    const messages = messagesCache[key] || [];
    if (!chatSection) return;
    chatSection.innerHTML = '';
    if (downloadCsvBtn) downloadCsvBtn.disabled = false;

    if (conversation.type === 'user') {
        const u = users.find(u => u.id === conversation.id);
        if (chatTitle) chatTitle.textContent = u ? displayName(u) : 'User';
        if (chatSubtitle) chatSubtitle.textContent = 'Chatting with ' + (u ? displayName(u) : 'user');
    } else {
        const g = groups.find(g => g.id == conversation.id);
        if (chatTitle) chatTitle.textContent = g ? g.name : 'Group';
        const memberCount = g && g.members && Array.isArray(g.members) ? g.members.length : 0;
        if (chatSubtitle) chatSubtitle.textContent = g ? (memberCount + ' members') : 'Group chat';
    }

    messages.forEach(m => {
        var div = document.createElement('div');
        var whoClass = m.sender.id === currentUserId ? 'message-bubble message-out' : 'message-bubble message-in';
        div.className = whoClass;
        div.setAttribute('data-msg-id', m.id);
        var reactionButtons = reactionOptions.map(function (emo) {
            return "<button class=\"msg-btn\" onclick=\"reactMessage('" + m.id + "','" + emo + "')\">" + emo + "</button>";
        }).join('');
        var actions = `
            <div class="msg-actions align-items-center">
                <div class="reaction-picker">` + reactionButtons + `</div>
                <button class="msg-btn" onclick="editMessage('${m.id}')">✏️</button>
                <button class="msg-btn" onclick="deleteMessage('${m.id}')">🗑️</button>
            </div>`;
        var reaction = m.reaction ? '<span class="reaction-badge mt-1">' + m.reaction + '</span>' : '';
        var sender = users.find(u => u.id === m.sender.id) || m.sender;
        var senderLabel = (conversation.type === 'group') ? '<div class="small text-muted">' + displayName(sender) + '</div>' : '';
        const timeStr = formatTime(m.created_at);
        
        // Render attachment if exists
        let attachmentHtml = '';
        if (m.attachment_url) {
            attachmentHtml = renderAttachment(m);
        }
        
        div.innerHTML = '<div class="d-flex justify-content-between align-items-start gap-2"><div class="flex-grow-1"><div class="msg-text">' + escapeHtml(m.text) + '</div>' + attachmentHtml + senderLabel + '</div>' + actions + '</div><div class="d-flex align-items-center gap-2 mt-1"><small class="time-badge">' + timeStr + '</small>' + reaction + '</div>';
        chatSection.appendChild(div);
    });
    scrollToBottom();
}

function clearAttachmentPreview() {
    if (attachmentPreview) {
        attachmentPreview.remove();
        attachmentPreview = null;
        currentAttachment = null;
    }
}

function showAttachmentPreview(file) {
    clearAttachmentPreview();
    currentAttachment = file;
    
    const reader = new FileReader();
    const previewDiv = document.createElement('div');
    previewDiv.className = 'attachment-preview';
    attachmentPreview = previewDiv;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const fileName = file.name;
    const fileSize = formatFileSize(file.size);
    
    let previewContent = '';
    if (isImage) {
        reader.onload = function(e) {
            previewContent = `
                <img src="${e.target.result}" alt="${fileName}">
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(fileName)}</div>
                    <div class="attachment-size">${fileSize}</div>
                </div>
                <div class="attachment-actions">
                    <button class="btn btn-sm btn-outline-primary btn-open" onclick="previewAttachment.open()">Open</button>
                    <button class="btn btn-sm btn-outline-secondary btn-download" onclick="previewAttachment.remove()">Remove</button>
                </div>
            `;
            previewDiv.innerHTML = previewContent;
        };
        reader.readAsDataURL(file);
    } else if (isVideo) {
        reader.onload = function(e) {
            previewContent = `
                <video controls><source src="${e.target.result}" type="${file.type}"></video>
                <div class="attachment-info">
                    <div class="attachment-name">${escapeHtml(fileName)}</div>
                    <div class="attachment-size">${fileSize}</div>
                </div>
                <div class="attachment-actions">
                    <button class="btn btn-sm btn-outline-primary btn-open" onclick="previewAttachment.open()">Open</button>
                    <button class="btn btn-sm btn-outline-secondary btn-download" onclick="previewAttachment.remove()">Remove</button>
                </div>
            `;
            previewDiv.innerHTML = previewContent;
        };
        reader.readAsDataURL(file);
    } else {
        previewContent = `
            <div class="attachment-info">
                <div class="attachment-icon">${getFileIcon(fileName)}</div>
                <div class="attachment-name">${escapeHtml(fileName)}</div>
                <div class="attachment-size">${fileSize}</div>
            </div>
            <div class="attachment-actions">
                <button class="btn btn-sm btn-outline-primary btn-open" onclick="previewAttachment.open()">Open</button>
                <button class="btn btn-sm btn-outline-secondary btn-download" onclick="previewAttachment.remove()">Remove</button>
            </div>
        `;
        previewDiv.innerHTML = previewContent;
    }
    
    if (messageForm) {
        messageForm.insertBefore(previewDiv, messageForm.firstChild);
    }
    
    window.previewAttachment = {
        open: function() {
            if (currentAttachment) {
                const url = URL.createObjectURL(currentAttachment);
                window.open(url, '_blank');
            }
        },
        remove: function() {
            clearAttachmentPreview();
            const fileInput = document.getElementById('attachmentInput');
            if (fileInput) fileInput.value = '';
        }
    };
}

function hookMessageForm() {
    if (!messageForm) return;
    messageForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        var text = messageInput ? messageInput.value.trim() : '';
        if ((!text && !currentAttachment) || !activeConversation) return;
        
        try {
            if (currentEditId) {
                await api(API_BASE + 'messages/' + currentEditId + '/', {
                    method: 'PATCH',
                    body: JSON.stringify({ text: text })
                });
                currentEditId = null;
                if (sendBtn) sendBtn.innerHTML = '<span class="me-1">➤</span>Send';
            } else {
                const formData = new FormData();
                formData.append('text', text);
                if (activeConversation.type === 'user') formData.append('to_user', activeConversation.id);
                if (activeConversation.type === 'group') formData.append('to_group', activeConversation.id);
                if (currentAttachment) {
                    formData.append('attachment', currentAttachment);
                }
                
                await api(API_BASE + 'messages/', {
                    method: 'POST',
                    body: formData,
                    isFormData: true
                });
            }
            clearAttachmentPreview();
            await loadMessages(activeConversation);
            if (messageInput) {
                messageInput.value = '';
                messageInput.focus();
            }
        } catch (e) {
            console.error(e);
            alert(e.message || 'Failed to send');
        }
    });
}

// typing indicator removed per requirements

function scrollToBottom() {
    var messagesEl = document.querySelector('.messages');
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Message actions
window.reactMessage = async function (msgId, emoji) {
    try {
        await api(API_BASE + 'messages/' + msgId + '/', {
            method: 'PATCH',
            body: JSON.stringify({ reaction: emoji })
        });
        await loadMessages(activeConversation);
    } catch (e) { console.error(e); }
};

window.editMessage = function (msgId) {
    const info = findMessageInCache(msgId);
    if (!info) return;
    currentEditId = msgId;
    if (messageInput) {
        messageInput.value = info.text;
        messageInput.focus();
    }
    if (sendBtn) sendBtn.innerHTML = 'Save';
};

window.deleteMessage = async function (msgId) {
    try {
        await api(API_BASE + 'messages/' + msgId + '/', { method: 'DELETE' });
        if (activeConversation) await loadMessages(activeConversation);
    } catch (e) { console.error(e); }
};

function findMessageInCache(msgId) {
    const keys = Object.keys(messagesCache);
    for (let k of keys) {
        const found = (messagesCache[k] || []).find(m => String(m.id) === String(msgId));
        if (found) return found;
    }
    return null;
}

function hookCsvDownload() {
    if (!downloadCsvBtn) return;
    downloadCsvBtn.addEventListener('click', async function () {
        if (!activeConversation || !currentUserId) return;
        let url = API_BASE + 'messages/export/?';
        url += activeConversation.type === 'user' ? 'user_id=' + activeConversation.id : 'group_id=' + activeConversation.id;
        try {
            const res = await fetch(url, { 
                headers: { 'X-CSRFToken': getCSRFToken() },
                credentials: 'same-origin'
            });
            const blob = await res.blob();
            const a = document.createElement('a');
            const fileLabel = activeConversation.type === 'user' ? 'chat-with-' + activeConversation.id : 'group-' + activeConversation.id;
            a.href = URL.createObjectURL(blob);
            a.download = fileLabel + '.csv';
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) { console.error(e); }
    });
}

function renderGroupMembers() {
    if (!groupMembersContainer) return;
    groupMembersContainer.innerHTML = '';
    users.forEach(function (user) {
        var col = document.createElement('div');
        col.className = 'col-sm-6';
        var photoUrl = getProfilePhotoUrl(user);
        var avatarHtml = photoUrl ? 
            '<img src="' + photoUrl + '" style="width:20px;height:20px;object-fit:cover;border-radius:50%;margin-right:8px;" alt="' + displayName(user) + '">' :
            '<span style="width:20px;height:20px;display:inline-block;text-align:center;line-height:20px;margin-right:8px;background:#6366f1;color:white;border-radius:50%;font-size:10px;">' + (displayName(user).charAt(0).toUpperCase()) + '</span>';
        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${user.id}" id="member-${user.id}">
                <label class="form-check-label d-flex align-items-center" for="member-${user.id}">
                    ${avatarHtml} ${displayName(user)} <span class="text-muted small">(${user.email})</span>
                </label>
            </div>`;
        groupMembersContainer.appendChild(col);
    });
}

function hookGroupForm() {
    if (!groupForm) return;
    groupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var name = groupNameInput ? groupNameInput.value.trim() : '';
        if (!name) return;
        var checkboxes = groupMembersContainer.querySelectorAll('input[type="checkbox"]:checked');
        var memberIds = [];
        checkboxes.forEach(cb => memberIds.push(parseInt(cb.value)));
        try {
            await api(API_BASE + 'groups/', {
                method: 'POST',
                body: JSON.stringify({ name: name, member_ids: memberIds })
            });
            await loadGroups();
            var modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
            if (modal) modal.hide();
            if (groupForm) groupForm.reset();
            renderGroupMembers();
        } catch (e) { console.error(e); alert(e.message || 'Group create failed'); }
    });
}

// Auth flows
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        window.location.href = '/?logout=1';
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatTime(dt) {
    try {
        const d = new Date(dt);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
        return dt;
    }
}

// Attachment input handler
function setupAttachmentInput() {
    const attachmentInput = document.getElementById('attachmentInput');
    const attachBtn = document.getElementById('attachBtn');
    
    if (attachBtn && attachmentInput) {
        attachBtn.addEventListener('click', function(e) {
            e.preventDefault();
            attachmentInput.click();
        });
    }
    
    if (attachmentInput) {
        attachmentInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                showAttachmentPreview(file);
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeVars();
    setupAttachmentInput();
    bootstrapApp();
    hookMessageForm();
    hookCsvDownload();
    hookGroupForm();
});

