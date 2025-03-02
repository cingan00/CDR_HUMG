/**
 * Utility functions for the Quiz Application
 */

// Display a toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        
        setTimeout(() => {
            toast.remove();
            
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}

// Check browser support for required features
function checkBrowserSupport() {
    const features = {
        localStorage: typeof localStorage !== 'undefined',
        json: typeof JSON !== 'undefined',
        fetch: typeof fetch !== 'undefined'
    };
    
    const missingFeatures = Object.keys(features).filter(feature => !features[feature]);
    
    if (missingFeatures.length) {
        alert(`Trình duyệt của bạn không hỗ trợ các tính năng: ${missingFeatures.join(', ')}\nVui lòng sử dụng trình duyệt hiện đại hơn.`);
        return false;
    }
    
    return true;
}

// Check if local storage is available
function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Log application errors
function logError(error, context = '') {
    console.error(`[Quiz App Error]${context ? ' ' + context : ''}:`, error);
    
    // You could send errors to a server here
}

// Function to get all available documents grouped by type
function getAvailableDocuments() {
    // Documents are organized by application type
    return {
        word: [
            { id: 'word-1', title: 'Word Document 1', path: 'docs/word-1.pdf' },
            { id: 'word-2', title: 'Word Document 2', path: 'docs/word-2.pdf' },
            { id: 'word-3', title: 'Word Document 3', path: 'docs/word-3.pdf' },
            { id: 'word-4', title: 'Word Document 4', path: 'docs/word-4.pdf' },
            { id: 'word-5', title: 'Word Document 5', path: 'docs/word-5.pdf' },
            { id: 'word-6', title: 'Word Document 6', path: 'docs/word-6.pdf' },
            { id: 'word-7', title: 'Word Document 7', path: 'docs/word-7.pdf' }
        ],
        excel: [
            { id: 'excel-1', title: 'Excel Document 1', path: 'docs/Excel-1.pdf' },
            { id: 'excel-2', title: 'Excel Document 2', path: 'docs/Excel-2.pdf' },
            { id: 'excel-3', title: 'Excel Document 3', path: 'docs/Excel-3.pdf' },
            { id: 'excel-4', title: 'Excel Document 4', path: 'docs/Excel-4.pdf' }
        ],
        powerpoint: [
            { id: 'powerpoint-1', title: 'PowerPoint Document 1', path: 'docs/powerpoint-1.pdf' },
            { id: 'powerpoint-2', title: 'PowerPoint Document 2', path: 'docs/powerpoint-2.pdf' },
            { id: 'powerpoint-3', title: 'PowerPoint Document 3', path: 'docs/powerpoint-3.pdf' },
            { id: 'powerpoint-4', title: 'PowerPoint Document 4', path: 'docs/powerpoint-4.pdf' }
        ]
    };
}

// Create document browser UI with inline PDF viewing
function createDocumentBrowser(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        logError('Container not found', 'Document Browser');
        return;
    }
    
    const documents = getAvailableDocuments();
    
    // Create browser structure
    const browserElement = document.createElement('div');
    browserElement.className = 'document-browser';
    
    // Create tabs for each document type
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'doc-tabs';
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'doc-content';
    
    // Process each document category
    Object.keys(documents).forEach((category, index) => {
        // Create tab
        const tab = document.createElement('button');
        tab.className = 'doc-tab';
        tab.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        tab.dataset.category = category;
        if (index === 0) tab.classList.add('active');
        
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update visible content
            document.querySelectorAll('.doc-category').forEach(c => c.style.display = 'none');
            document.getElementById(`doc-category-${category}`).style.display = 'block';
        });
        
        tabsContainer.appendChild(tab);
        
        // Create content section
        const categoryContent = document.createElement('div');
        categoryContent.className = 'doc-category';
        categoryContent.id = `doc-category-${category}`;
        categoryContent.style.display = index === 0 ? 'block' : 'none';
        
        // Create document list
        const docList = document.createElement('ul');
        docList.className = 'doc-list';
        
        documents[category].forEach(doc => {
            const listItem = document.createElement('li');
            
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = doc.title;
            link.dataset.docPath = doc.path;
            link.dataset.docId = doc.id;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showToast(`Đang mở tài liệu: ${doc.title}`, 'success');
                viewPdfInPage(doc.path, doc.title);
                
                // Mark selected document
                document.querySelectorAll('.doc-list a').forEach(a => a.classList.remove('selected'));
                link.classList.add('selected');
            });
            
            listItem.appendChild(link);
            docList.appendChild(listItem);
        });
        
        categoryContent.appendChild(docList);
        contentContainer.appendChild(categoryContent);
    });
    
    browserElement.appendChild(tabsContainer);
    browserElement.appendChild(contentContainer);
    
    container.appendChild(browserElement);
    
    showToast('Tài liệu thực hành đã được tải', 'info');
}

// Open a specific document by ID in the PDF viewer
function openDocument(docId) {
    const documents = getAvailableDocuments();
    let foundDoc = null;
    
    // Find the document across all categories
    Object.values(documents).forEach(category => {
        const doc = category.find(item => item.id === docId);
        if (doc) foundDoc = doc;
    });
    
    if (foundDoc) {
        viewPdfInPage(foundDoc.path, foundDoc.title);
        showToast(`Đang mở tài liệu: ${foundDoc.title}`, 'success');
        return true;
    } else {
        showToast('Không tìm thấy tài liệu yêu cầu', 'error');
        return false;
    }
}

// View PDF in the in-page viewer
function viewPdfInPage(pdfPath, title) {
    // Hide the placeholder and show loading indicator
    const placeholder = document.getElementById('pdf-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    
    // Store the current PDF path in a data attribute
    const pdfContainer = document.getElementById('pdf-container');
    if (pdfContainer) {
        pdfContainer.dataset.currentPdf = pdfPath;
        pdfContainer.dataset.currentTitle = title;
    }
    
    // The actual PDF loading happens in pdf-viewer.js
    // This will trigger the loading of the PDF
    if (window.loadPdf) {
        window.loadPdf(pdfPath);
    } else {
        logError('PDF viewer not initialized', 'PDF Viewer');
    }
    
    // Update download button
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = pdfPath;
            link.download = title.replace(/[^\w\s]/gi, '') + '.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
}

// Setup navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show selected section
            const sectionId = link.getAttribute('data-section');
            const allSections = document.querySelectorAll('.main-section');
            
            allSections.forEach(section => {
                section.classList.remove('active');
            });
            
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.classList.add('active');
                
                // If switching to practice section and no document is selected yet,
                // show the placeholder
                if (sectionId === 'practice-container') {
                    const pdfContainer = document.getElementById('pdf-container');
                    const placeholder = document.getElementById('pdf-placeholder');
                    
                    if (placeholder && (!pdfContainer || !pdfContainer.dataset.currentPdf)) {
                        placeholder.style.display = 'flex';
                    }
                }
            }
            
            // Save the current active section in localStorage
            localStorage.setItem('activeSection', sectionId);
        });
    });
    
    // Restore the previously active section if available
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
        const savedLink = document.querySelector(`.nav-link[data-section="${savedSection}"]`);
        if (savedLink) {
            savedLink.click();
        }
    }
}

// Initialize app functionality
function initializeApp() {
    // Check browser support
    if (!checkBrowserSupport()) {
        return;
    }
    
    // Setup navigation
    setupNavigation();
    
    // Create document browser when the DOM is loaded
    if (document.getElementById('document-browser')) {
        createDocumentBrowser('document-browser');
    }
    
    // Add keyboard shortcuts for global navigation
    document.addEventListener('keydown', (e) => {
        // Alt+1 for Quiz Section
        if (e.altKey && e.key === '1') {
            const quizLink = document.querySelector('.nav-link[data-section="quiz-container"]');
            if (quizLink) quizLink.click();
        }
        // Alt+2 for Practice Section
        else if (e.altKey && e.key === '2') {
            const practiceLink = document.querySelector('.nav-link[data-section="practice-container"]');
            if (practiceLink) practiceLink.click();
        }
    });
    
    showToast('Ứng dụng đã sẵn sàng', 'info');
}

// Export utils
window.QuizUtils = {
    showToast,
    checkBrowserSupport,
    isLocalStorageAvailable,
    logError,
    getAvailableDocuments,
    createDocumentBrowser,
    openDocument,
    viewPdfInPage,
    initializeApp
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
