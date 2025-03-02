/**
 * Document Browser Implementation
 * Lists all available PDF documents and handles their selection
 */

class DocumentBrowser {
  constructor() {
    // References to DOM elements
    this.categoryTabs = document.querySelectorAll('.category-tab');
    this.documentLists = {
      word: document.getElementById('word-documents'),
      excel: document.getElementById('excel-documents'),
      powerpoint: document.getElementById('powerpoint-documents')
    };
    
    // Documents data
    this.documents = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the document browser
   */
  async init() {
    // Set up event listeners for category tabs
    this.setupCategoryTabs();
    
    // Load documents data
    this.documents = window.QuizUtils.getAvailableDocuments();
    
    // Populate document lists
    this.populateDocumentLists();
    
    // Check for document parameter in URL
    this.checkUrlParameters();
  }
  
  /**
   * Set up event listeners for category tabs
   */
  setupCategoryTabs() {
    this.categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        this.categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding document list
        const category = tab.getAttribute('data-category');
        Object.values(this.documentLists).forEach(list => list.classList.remove('active'));
        this.documentLists[category].classList.add('active');
      });
    });
  }
  
  /**
   * Populate document lists based on categories
   */
  populateDocumentLists() {
    if (!this.documents) return;
    
    // Process each category
    Object.keys(this.documents).forEach(category => {
      const listElement = this.documentLists[category];
      if (!listElement) return;
      
      // Clear existing content
      listElement.innerHTML = '';
      
      // No documents message
      if (!this.documents[category] || this.documents[category].length === 0) {
        const noDocEl = document.createElement('div');
        noDocEl.className = 'no-documents';
        noDocEl.textContent = 'Không có tài liệu trong danh mục này';
        listElement.appendChild(noDocEl);
        return;
      }
      
      // Create document items
      this.documents[category].forEach(doc => {
        const docItem = document.createElement('div');
        docItem.className = 'document-item';
        docItem.setAttribute('data-doc-id', doc.id);
        docItem.setAttribute('data-doc-path', doc.path);
        
        const docTitle = document.createElement('span');
        docTitle.className = 'document-title';
        docTitle.textContent = doc.title;
        
        const docInfo = document.createElement('span');
        docInfo.className = 'document-info';
        
        // Set icon based on file type
        let icon;
        if (category === 'word') icon = 'fa-file-word';
        else if (category === 'excel') icon = 'fa-file-excel';
        else if (category === 'powerpoint') icon = 'fa-file-powerpoint';
        else icon = 'fa-file-pdf';
        
        docInfo.innerHTML = `<i class="fas ${icon}"></i> PDF Document`;
        
        // Add elements to document item
        docItem.appendChild(docTitle);
        docItem.appendChild(docInfo);
        
        // Add click event
        docItem.addEventListener('click', () => {
          // Update selected state
          document.querySelectorAll('.document-item').forEach(item => {
            item.classList.remove('selected');
          });
          docItem.classList.add('selected');
          
          // Load the PDF
          if (window.loadPdf) {
            window.loadPdf(doc.path, doc.title);
          }
          
          // Update URL parameter
          this.updateUrlParameter(doc.id);
        });
        
        listElement.appendChild(docItem);
      });
    });
  }
  
  /**
   * Check for document ID in URL parameters
   */
  checkUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('doc');
    
    if (docId) {
      // Find document in our data
      let foundDoc = null;
      let foundCategory = null;
      
      Object.entries(this.documents).forEach(([category, docs]) => {
        const doc = docs.find(d => d.id === docId);
        if (doc) {
          foundDoc = doc;
          foundCategory = category;
        }
      });
      
      if (foundDoc && foundCategory) {
        // Activate the correct category tab
        this.categoryTabs.forEach(tab => {
          if (tab.getAttribute('data-category') === foundCategory) {
            tab.click();
          }
        });
        
        // Find and click the document item
        setTimeout(() => {
          const docElement = document.querySelector(`.document-item[data-doc-id="${docId}"]`);
          if (docElement) {
            docElement.click();
            docElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    }
  }
  
  /**
   * Update URL parameter with selected document
   */
  updateUrlParameter(docId) {
    const url = new URL(window.location);
    url.searchParams.set('doc', docId);
    window.history.replaceState({}, '', url);
  }
}

// Initialize document browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DocumentBrowser();
});
