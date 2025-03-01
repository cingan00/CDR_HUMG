
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

// Export utils
window.QuizUtils = {
    showToast,
    checkBrowserSupport,
    isLocalStorageAvailable,
    logError
};
