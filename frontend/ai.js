/**
 * AI Assistant Page JavaScript for Salyte Beacon
 * Handles chat functionality, message processing, and AI interactions
 */

// Global variables
let currentChatId = null;
let chatHistory = [];
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AI chat functionality
    initializeAIChat();
});

/**
 * Initialize all AI chat functionality
 */
function initializeAIChat() {
    // Setup event listeners
    setupEventListeners();
    
    // Load chat history
    loadChatHistory();
    
    // Initialize file upload
    initializeFileUpload();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize responsive sidebar
    initializeResponsiveSidebar();
    
    console.log('AI Assistant chat initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    
    // Message input events
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keypress', handleKeyPress);
    
    // Send button event
    sendBtn.addEventListener('click', sendMessage);
    
    // Chat history clicks
    document.addEventListener('click', function(e) {
        if (e.target.closest('.chat-history-item')) {
            selectChatHistoryItem(e.target.closest('.chat-history-item'));
        }
    });
}

/**
 * Handle input changes
 */
function handleInputChange() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    
    // Enable/disable send button
    sendBtn.disabled = messageInput.value.trim().length === 0;
    
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    
    // Hide suggestions when typing
    const suggestions = document.getElementById('inputSuggestions');
    if (messageInput.value.trim().length > 0) {
        suggestions.style.display = 'none';
    } else {
        suggestions.style.display = 'flex';
    }
}

/**
 * Handle key press events
 */
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

/**
 * Send message to AI
 */
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || isTyping) return;
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    handleInputChange();
    
    // Add user message to chat
    addMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to AI API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                message: message,
                chatId: currentChatId,
                context: getChatContext()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response
        addMessage('ai', data.answer, data.sources);
        
        // Update chat history
        updateChatHistory(message, data.answer);
        
    } catch (error) {
        hideTypingIndicator();
        console.error('Chat error:', error);
        addMessage('ai', 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.', null, true);
    }
}

/**
 * Add message to chat
 */
function addMessage(type, content, sources = null, isError = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>${escapeHtml(content)}</p>
                </div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
    } else {
        const sourcesButton = sources ? 
            `<button class="btn sources-btn btn-sm" onclick="showSources(${JSON.stringify(sources).replace(/"/g, '&quot;')})">
                <i class="fas fa-book me-1"></i>Sources
            </button>` : '';
            
        const errorClass = isError ? 'text-danger' : '';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble ${errorClass}">
                    ${formatAIResponse(content)}
                </div>
                <div class="message-timestamp">
                    ${timestamp}
                    ${sourcesButton}
                </div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Add to chat history array
    chatHistory.push({
        type: type,
        content: content,
        timestamp: new Date(),
        sources: sources
    });
}

/**
 * Format AI response with proper HTML
 */
function formatAIResponse(content) {
    // Convert markdown-like formatting to HTML
    let formatted = escapeHtml(content);
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Lists (simple implementation)
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }
    
    return `<p>${formatted}</p>`;
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    isTyping = true;
    const typingIndicator = document.getElementById('typingIndicator');
    const chatMessages = document.getElementById('chatMessages');
    
    chatMessages.appendChild(typingIndicator);
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'none';
}

/**
 * Show sources modal
 */
function showSources(sources) {
    const sourcesContent = document.getElementById('sourcesContent');
    
    if (!sources || sources.length === 0) {
        sourcesContent.innerHTML = '<p class="text-muted">No sources available for this response.</p>';
    } else {
        let sourcesHtml = '<div class="list-group">';
        sources.forEach((source, index) => {
            sourcesHtml += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${escapeHtml(source.title || `Source ${index + 1}`)}</h6>
                        <small class="text-muted">${source.type || 'Reference'}</small>
                    </div>
                    <p class="mb-1">${escapeHtml(source.description || source)}</p>
                    ${source.url ? `<small><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">View Source <i class="fas fa-external-link-alt"></i></a></small>` : ''}
                </div>
            `;
        });
        sourcesHtml += '</div>';
        sourcesContent.innerHTML = sourcesHtml;
    }
    
    const sourcesModal = new bootstrap.Modal(document.getElementById('sourcesModal'));
    sourcesModal.show();
}

/**
 * Quick question handlers
 */
function askQuickQuestion(category) {
    const questions = {
        'water-quality': 'What are the key parameters for assessing drinking water quality?',
        'testing': 'What are the most effective methods for testing water contamination?',
        'treatment': 'What are the best water treatment options for rural communities?',
        'safety': 'What are the WHO guidelines for safe drinking water?'
    };
    
    const question = questions[category];
    if (question) {
        document.getElementById('messageInput').value = question;
        handleInputChange();
        sendMessage();
    }
}

/**
 * Set suggestion in input
 */
function setSuggestion(suggestion) {
    document.getElementById('messageInput').value = suggestion;
    handleInputChange();
    document.getElementById('messageInput').focus();
}

/**
 * Start new chat
 */
function startNewChat() {
    currentChatId = null;
    chatHistory = [];
    
    // Clear chat messages except welcome message
    const chatMessages = document.getElementById('chatMessages');
    const welcomeMessage = chatMessages.querySelector('.ai-message');
    chatMessages.innerHTML = '';
    chatMessages.appendChild(welcomeMessage);
    
    // Clear active chat history item
    document.querySelectorAll('.chat-history-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Reset input
    const messageInput = document.getElementById('messageInput');
    messageInput.value = '';
    handleInputChange();
    
    console.log('New chat started');
}

/**
 * Export chat
 */
function exportChat() {
    if (chatHistory.length === 0) {
        showNotification('No messages to export', 'warning');
        return;
    }
    
    const chatData = {
        timestamp: new Date().toISOString(),
        messages: chatHistory
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `salyte-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Chat exported successfully', 'success');
}

/**
 * Clear chat
 */
function clearChat() {
    if (confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
        startNewChat();
        showNotification('Chat cleared', 'info');
    }
}

/**
 * Initialize file upload
 */
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
}

/**
 * File upload handlers
 */
function uploadFile() {
    const fileUploadModal = new bootstrap.Modal(document.getElementById('fileUploadModal'));
    fileUploadModal.show();
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    if (files.length === 0) return;
    
    // Validate files
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'text/csv', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];
    
    Array.from(files).forEach(file => {
        if (file.size > maxSize) {
            showNotification(`File ${file.name} is too large (max 10MB)`, 'error');
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            showNotification(`File ${file.name} is not supported`, 'error');
            return;
        }
        
        validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
        // Show upload progress
        const uploadProgress = document.getElementById('uploadProgress');
        uploadProgress.style.display = 'block';
        
        // Simulate upload progress
        let progress = 0;
        const progressBar = uploadProgress.querySelector('.progress-bar');
        
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    const modal = bootstrap.Modal.getInstance(document.getElementById('fileUploadModal'));
                    modal.hide();
                    
                    // Add message about file upload
                    const fileNames = validFiles.map(f => f.name).join(', ');
                    addMessage('user', `Uploaded files: ${fileNames}`);
                    addMessage('ai', `I've received your files: ${fileNames}. I can help analyze water test results, interpret data, or answer questions about the content. What would you like to know?`);
                }, 1000);
            }
            progressBar.style.width = progress + '%';
        }, 200);
    }
}

function processUploadedFiles() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        showNotification('Please select files to upload', 'warning');
        return;
    }
    
    processFiles(fileInput.files);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Escape to clear input
        if (e.key === 'Escape') {
            const messageInput = document.getElementById('messageInput');
            messageInput.value = '';
            handleInputChange();
        }
        
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('messageInput').focus();
        }
        
        // Ctrl/Cmd + N for new chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            startNewChat();
        }
        
        // Ctrl/Cmd + S to export
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            exportChat();
        }
    });
}

/**
 * Initialize responsive sidebar
 */
function initializeResponsiveSidebar() {
    // Mobile sidebar toggle
    const chatHeader = document.querySelector('.chat-header');
    if (window.innerWidth <= 768) {
        chatHeader.addEventListener('click', function(e) {
            if (e.target === chatHeader || e.target === chatHeader.querySelector('.chat-title')) {
                toggleSidebar();
            }
        });
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.chat-sidebar');
    sidebar.classList.toggle('show');
    
    // Close sidebar when clicking outside
    if (sidebar.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeSidebarOnOutsideClick);
        }, 100);
    }
}

function closeSidebarOnOutsideClick(e) {
    const sidebar = document.querySelector('.chat-sidebar');
    if (!sidebar.contains(e.target)) {
        sidebar.classList.remove('show');
        document.removeEventListener('click', closeSidebarOnOutsideClick);
    }
}

/**
 * Utility functions
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getChatContext() {
    // Return last few messages for context
    return chatHistory.slice(-5);
}

function getAuthToken() {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
}

function loadChatHistory() {
    // Mock loading chat history from localStorage
    const saved = localStorage.getItem('salyteAIChats');
    if (saved) {
        try {
            const chats = JSON.parse(saved);
            console.log('Loaded chat history:', chats);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
}

function updateChatHistory(userMessage, aiResponse) {
    // Mock updating chat history
    const chatSession = {
        id: currentChatId || Date.now(),
        timestamp: new Date(),
        preview: userMessage.substring(0, 50),
        messages: chatHistory
    };
    
    console.log('Updated chat session:', chatSession);
    
    // In a real app, this would save to localStorage or send to API
}

function selectChatHistoryItem(item) {
    // Remove active class from all items
    document.querySelectorAll('.chat-history-item').forEach(i => i.classList.remove('active'));
    
    // Add active class to clicked item
    item.classList.add('active');
    
    // Load chat (mock implementation)
    console.log('Selected chat:', item.querySelector('strong').textContent);
}

/**
 * Notification system (reuse from other pages)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Make functions globally available
window.askQuickQuestion = askQuickQuestion;
window.setSuggestion = setSuggestion;
window.startNewChat = startNewChat;
window.exportChat = exportChat;
window.clearChat = clearChat;
window.uploadFile = uploadFile;
window.processUploadedFiles = processUploadedFiles;
window.showSources = showSources;


