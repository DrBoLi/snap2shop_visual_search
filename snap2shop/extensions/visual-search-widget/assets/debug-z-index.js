/**
 * Z-Index Debugger for Visual Search Modal
 * Helps identify why modal appears behind search elements
 */

(function() {
  'use strict';

  window.debugZIndex = {
    
    // Analyze all elements with z-index
    analyzeZIndexes: function() {
      const elements = document.querySelectorAll('*');
      const zIndexedElements = [];
      
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const zIndex = computed.zIndex;
        const position = computed.position;
        
        // Only elements with numeric z-index and proper positioning create stacking contexts
        if (zIndex !== 'auto' && position !== 'static') {
          zIndexedElements.push({
            element: el,
            zIndex: parseInt(zIndex) || 0,
            position: position,
            className: el.className,
            id: el.id,
            tagName: el.tagName,
            display: computed.display,
            visibility: computed.visibility,
            isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
          });
        }
      });
      
      // Sort by z-index descending
      zIndexedElements.sort((a, b) => b.zIndex - a.zIndex);
      
      console.group('[Z-Index Debug] Top 20 Elements by Z-Index');
      zIndexedElements.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. z-index: ${item.zIndex}`, {
          element: item.element,
          className: item.className,
          id: item.id,
          position: item.position,
          isVisible: item.isVisible
        });
      });
      console.groupEnd();
      
      return zIndexedElements;
    },
    
    // Find stacking context parents
    findStackingContexts: function(element) {
      const contexts = [];
      let current = element;
      
      while (current && current !== document.body) {
        const computed = window.getComputedStyle(current);
        
        // Check if this creates a stacking context
        const createsContext = 
          computed.zIndex !== 'auto' ||
          computed.opacity < 1 ||
          computed.transform !== 'none' ||
          computed.filter !== 'none' ||
          computed.perspective !== 'none' ||
          computed.isolation === 'isolate' ||
          computed.position === 'fixed' ||
          computed.webkitTransform !== 'none' ||
          computed.mixBlendMode !== 'normal' ||
          computed.willChange === 'transform' ||
          computed.willChange === 'opacity' ||
          computed.contain === 'layout' ||
          computed.contain === 'paint' ||
          computed.contain === 'strict' ||
          computed.contain === 'content';
        
        if (createsContext) {
          contexts.push({
            element: current,
            reason: this.getStackingReason(computed),
            zIndex: computed.zIndex,
            className: current.className,
            id: current.id
          });
        }
        
        current = current.parentElement;
      }
      
      return contexts;
    },
    
    getStackingReason: function(computed) {
      const reasons = [];
      
      if (computed.zIndex !== 'auto') reasons.push(`z-index: ${computed.zIndex}`);
      if (computed.opacity < 1) reasons.push(`opacity: ${computed.opacity}`);
      if (computed.transform !== 'none') reasons.push('transform');
      if (computed.filter !== 'none') reasons.push('filter');
      if (computed.perspective !== 'none') reasons.push('perspective');
      if (computed.isolation === 'isolate') reasons.push('isolation: isolate');
      if (computed.position === 'fixed') reasons.push('position: fixed');
      if (computed.mixBlendMode !== 'normal') reasons.push('mix-blend-mode');
      if (computed.contain && computed.contain !== 'none') reasons.push(`contain: ${computed.contain}`);
      
      return reasons.join(', ');
    },
    
    // Debug modal visibility
    debugModal: function() {
      const modal = document.getElementById('visual-search-modal');
      
      if (!modal) {
        console.error('[Z-Index Debug] Modal not found!');
        return;
      }
      
      console.group('[Z-Index Debug] Modal Analysis');
      
      // Modal computed styles
      const modalComputed = window.getComputedStyle(modal);
      console.log('Modal styles:', {
        display: modalComputed.display,
        zIndex: modalComputed.zIndex,
        position: modalComputed.position,
        visibility: modalComputed.visibility,
        opacity: modalComputed.opacity,
        transform: modalComputed.transform,
        pointerEvents: modalComputed.pointerEvents
      });
      
      // Modal stacking contexts
      const modalContexts = this.findStackingContexts(modal);
      console.log('Modal stacking contexts:', modalContexts);
      
      // Check what's potentially above the modal
      const allElements = this.analyzeZIndexes();
      const modalZIndex = parseInt(modalComputed.zIndex) || 0;
      const elementsAbove = allElements.filter(item => 
        item.zIndex >= modalZIndex && item.element !== modal
      );
      
      if (elementsAbove.length > 0) {
        console.warn('Elements with equal or higher z-index:', elementsAbove);
      }
      
      // Check parent positioning
      let parent = modal.parentElement;
      while (parent && parent !== document.body) {
        const parentComputed = window.getComputedStyle(parent);
        if (parentComputed.position !== 'static' || parentComputed.transform !== 'none') {
          console.warn('Parent creates stacking context:', {
            element: parent,
            position: parentComputed.position,
            transform: parentComputed.transform,
            zIndex: parentComputed.zIndex
          });
        }
        parent = parent.parentElement;
      }
      
      console.groupEnd();
    },
    
    // Find overlapping elements at click position
    findElementsAtPoint: function(x, y) {
      const elements = document.elementsFromPoint(x, y);
      
      console.group(`[Z-Index Debug] Elements at point (${x}, ${y})`);
      elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        console.log(`${index}. ${el.tagName}`, {
          element: el,
          className: el.className,
          id: el.id,
          zIndex: computed.zIndex,
          position: computed.position
        });
      });
      console.groupEnd();
      
      return elements;
    },
    
    // Monitor z-index changes
    monitorChanges: function() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
            const computed = window.getComputedStyle(mutation.target);
            if (computed.zIndex !== 'auto') {
              console.log('[Z-Index Change]', {
                element: mutation.target,
                zIndex: computed.zIndex,
                className: mutation.target.className
              });
            }
          }
        });
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true
      });
      
      console.log('[Z-Index Debug] Monitoring started');
      return observer;
    },
    
    // Force modal to absolute top
    forceModalTop: function() {
      const modal = document.getElementById('visual-search-modal');
      if (!modal) {
        console.error('[Z-Index Debug] Modal not found');
        return;
      }
      
      // Find highest z-index
      const allElements = this.analyzeZIndexes();
      const highestZIndex = allElements.length > 0 ? allElements[0].zIndex : 9999;
      
      // Set modal z-index higher
      const newZIndex = Math.max(highestZIndex + 1000, 10000000);
      modal.style.setProperty('z-index', newZIndex.toString(), 'important');
      
      console.log(`[Z-Index Debug] Modal z-index set to ${newZIndex}`);
      
      // Also ensure modal is last in DOM
      if (modal.parentNode !== document.body || document.body.lastChild !== modal) {
        document.body.appendChild(modal);
        console.log('[Z-Index Debug] Modal moved to end of body');
      }
      
      return newZIndex;
    },
    
    // Run full diagnostic
    runDiagnostic: function() {
      console.clear();
      console.log('='.repeat(50));
      console.log('[Z-Index Debug] Running Full Diagnostic');
      console.log('='.repeat(50));
      
      // Analyze all z-indexes
      this.analyzeZIndexes();
      
      // Debug modal specifically
      this.debugModal();
      
      // Check click position
      document.addEventListener('click', (e) => {
        console.log('\n[Z-Index Debug] Click detected');
        this.findElementsAtPoint(e.clientX, e.clientY);
      }, { once: true });
      
      // Monitor changes
      this.monitorChanges();
      
      console.log('\nClick anywhere to see elements at that position');
      console.log('Use debugZIndex.forceModalTop() to force modal to top');
    }
  };
  
  // Auto-run diagnostic when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.debugZIndex.runDiagnostic();
    });
  } else {
    window.debugZIndex.runDiagnostic();
  }
  
})();