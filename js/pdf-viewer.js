/**
 * PDF Viewer Implementation
 * Uses PDF.js library to render PDFs in the browser
 */

class PDFViewer {
  constructor() {
    this.pdfDoc = null;
    this.pageNum = 1;
    this.pageRendering = false;
    this.pageNumPending = null;
    this.scale = 1.0;
    this.canvas = document.getElementById('pdf-viewer');
    this.ctx = this.canvas.getContext('2d');
    this.MAX_ZOOM = 5.0;
    this.MIN_ZOOM = 0.5;
    this.isFullscreen = false;
    this.pdfContainer = document.getElementById('pdf-container');
    
    // UI elements
    this.currentPageEl = document.getElementById('current-page');
    this.totalPagesEl = document.getElementById('total-pages');
    this.prevButton = document.getElementById('prev-page');
    this.nextButton = document.getElementById('next-page');
    this.zoomInButton = document.getElementById('zoom-in');
    this.zoomOutButton = document.getElementById('zoom-out');
    this.zoomValueEl = document.getElementById('zoom-value');
    this.fullscreenButton = document.getElementById('fullscreen');
    this.downloadButton = document.getElementById('download-pdf');
    this.documentTitleEl = document.getElementById('current-document-title');
    
    // High-quality rendering settings
    this.renderQuality = 2; // Higher quality multiplier
    this.currentPdfUrl = null;
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Button event listeners
    this.prevButton.addEventListener('click', () => this.onPrevPage());
    this.nextButton.addEventListener('click', () => this.onNextPage());
    this.zoomInButton.addEventListener('click', () => this.onZoomIn());
    this.zoomOutButton.addEventListener('click', () => this.onZoomOut());
    this.fullscreenButton?.addEventListener('click', () => this.toggleFullscreen());
    this.downloadButton?.addEventListener('click', () => this.downloadPdf());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.pdfDoc) return;
      
      if (e.key === 'ArrowLeft') {
        this.onPrevPage();
      } else if (e.key === 'ArrowRight') {
        this.onNextPage();
      } else if (e.key === '+' || e.key === '=') {
        this.onZoomIn();
      } else if (e.key === '-') {
        this.onZoomOut();
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });
    
    // Mouse wheel zoom with Ctrl key
    this.canvas.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.onZoomIn();
        } else {
          this.onZoomOut();
        }
      }
    });
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      if (this.fullscreenButton) {
        const icon = this.fullscreenButton.querySelector('i');
        if (icon) {
          icon.className = this.isFullscreen ? 
            'fas fa-compress-alt' : 'fas fa-expand-alt';
        }
      }
    });
  }
  
  /**
   * Load a PDF document
   * @param {string} url - The URL of the PDF file
   * @param {string} title - The title of the document
   */
  async loadPDF(url, title = 'Document') {
    try {
      // Show loading indicator
      this.showLoading();
      
      // Store the current PDF URL for download
      this.currentPdfUrl = url;
      
      // Update title
      this.documentTitleEl.textContent = title;
      
      // Load document with better caching options
      const loadingTask = pdfjsLib.getDocument({
        url: url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/',
        cMapPacked: true
      });
      
      this.pdfDoc = await loadingTask.promise;
      
      // Update UI elements
      this.totalPagesEl.textContent = this.pdfDoc.numPages;
      this.enableControls(true);
      
      // Reset to first page and current scale
      this.pageNum = 1;
      this.renderCurrentPage();
      
      // Remove loading indicator
      this.hideLoading();
      
      return true;
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError('Không thể tải tài liệu PDF.');
      this.hideLoading();
      return false;
    }
  }
  
  /**
   * Render the current page with high quality
   */
  async renderCurrentPage() {
    if (!this.pdfDoc) return;
    
    this.pageRendering = true;
    this.updatePageInfo();
    
    try {
      const page = await this.pdfDoc.getPage(this.pageNum);
      
      // Use higher pixel density for better quality
      const viewport = page.getViewport({ scale: this.scale });
      
      // Apply quality multiplier for better rendering
      const outputScale = this.renderQuality;
      
      // Set canvas dimensions with higher resolution
      this.canvas.height = viewport.height * outputScale;
      this.canvas.width = viewport.width * outputScale;
      this.canvas.style.height = `${viewport.height}px`;
      this.canvas.style.width = `${viewport.width}px`;
      
      // Scale context to ensure correct rendering
      this.ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      
      // Render PDF page with higher quality
      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport,
        enableWebGL: true,
        renderInteractiveForms: true
      };
      
      await page.render(renderContext).promise;
      this.pageRendering = false;
      
      // Update zoom level display
      if (this.zoomValueEl) {
        this.zoomValueEl.textContent = `${Math.round(this.scale * 100)}%`;
      }
      
      // Check if there's a pending page request
      if (this.pageNumPending !== null) {
        this.pageNum = this.pageNumPending;
        this.pageNumPending = null;
        this.renderCurrentPage();
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      this.pageRendering = false;
      this.showError('Không thể hiển thị trang.');
    }
  }
  
  /**
   * Go to previous page with animation
   */
  onPrevPage() {
    if (!this.pdfDoc || this.pageNum <= 1) return;
    
    this.pageNum--;
    this.animatePageTransition('right');
    this.queueRenderPage();
  }
  
  /**
   * Go to next page with animation
   */
  onNextPage() {
    if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) return;
    
    this.pageNum++;
    this.animatePageTransition('left');
    this.queueRenderPage();
  }
  
  /**
   * Animate page transition
   */
  animatePageTransition(direction) {
    // Add a subtle animation when changing pages
    const animation = this.canvas.animate([
      { opacity: 0.7, transform: `translateX(${direction === 'left' ? '10px' : '-10px'})` },
      { opacity: 1, transform: 'translateX(0)' }
    ], {
      duration: 200,
      easing: 'ease-out'
    });
  }
  
  /**
   * Queue rendering of a page to prevent multiple in-process renderings
   */
  queueRenderPage() {
    if (this.pageRendering) {
      this.pageNumPending = this.pageNum;
    } else {
      this.renderCurrentPage();
    }
  }
  
  /**
   * Zoom in the document with smooth animation
   */
  onZoomIn() {
    if (this.scale >= this.MAX_ZOOM) return;
    
    // Smoother zoom increments
    const increment = this.scale < 1 ? 0.1 : 0.25;
    this.scale = Math.min(this.MAX_ZOOM, this.scale + increment);
    this.renderCurrentPage();
  }
  
  /**
   * Zoom out the document with smooth animation
   */
  onZoomOut() {
    if (this.scale <= this.MIN_ZOOM) return;
    
    // Smoother zoom decrements
    const decrement = this.scale <= 1 ? 0.1 : 0.25;
    this.scale = Math.max(this.MIN_ZOOM, this.scale - decrement);
    this.renderCurrentPage();
  }
  
  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }
  
  /**
   * Enter fullscreen mode
   */
  enterFullscreen() {
    const docContainer = document.querySelector('.document-container');
    if (docContainer && docContainer.requestFullscreen) {
      docContainer.requestFullscreen()
        .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
    }
  }
  
  /**
   * Exit fullscreen mode
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  
  /**
   * Download the current PDF
   */
  downloadPdf() {
    if (!this.currentPdfUrl || !this.documentTitleEl.textContent) return;
    
    const link = document.createElement('a');
    link.href = this.currentPdfUrl;
    link.download = `${this.documentTitleEl.textContent.replace(/[^\w\-]/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Update the page information UI
   */
  updatePageInfo() {
    this.currentPageEl.textContent = this.pageNum;
    
    // Update prev/next button states
    this.prevButton.disabled = this.pageNum <= 1;
    this.nextButton.disabled = this.pageNum >= this.pdfDoc.numPages;
  }
  
  /**
   * Enable or disable controls
   */
  enableControls(enabled) {
    this.prevButton.disabled = !enabled || this.pageNum <= 1;
    this.nextButton.disabled = !enabled || this.pageNum >= (this.pdfDoc?.numPages || 1);
    this.zoomInButton.disabled = !enabled;
    this.zoomOutButton.disabled = !enabled;
    this.downloadButton.disabled = !enabled;
    if (this.fullscreenButton) this.fullscreenButton.disabled = !enabled;
  }
  
  /**
   * Show loading indicator with modern spinner
   */
  showLoading() {
    const placeholder = document.getElementById('pdf-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    
    // Create loading indicator if doesn't exist
    let loadingEl = document.querySelector('.pdf-loading');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'pdf-loading';
      loadingEl.innerHTML = '<div class="spinner"></div><p>Đang tải tài liệu...</p>';
      document.getElementById('pdf-container').appendChild(loadingEl);
    } else {
      loadingEl.style.display = 'flex';
    }
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loadingEl = document.querySelector('.pdf-loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }
  
  /**
   * Show error message with icon
   */
  showError(message) {
    const placeholder = document.getElementById('pdf-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.innerHTML = `
        <div class="error-container">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
          <button class="retry-button">Thử lại</button>
        </div>
      `;
      
      const retryButton = placeholder.querySelector('.retry-button');
      if (retryButton && this.currentPdfUrl) {
        retryButton.addEventListener('click', () => {
          this.loadPDF(this.currentPdfUrl, this.documentTitleEl.textContent);
        });
      }
    }
    
    this.enableControls(false);
  }
}

// Initialize PDF viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pdfViewer = new PDFViewer();
  
  // Expose loadPdf function globally
  window.loadPdf = (pdfPath, title) => {
    window.pdfViewer.loadPDF(pdfPath, title);
  };
});
