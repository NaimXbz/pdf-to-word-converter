document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const processBtn = document.getElementById('processBtn');
    const resultContainer = document.getElementById('resultContainer');
    const resultFilename = document.getElementById('resultFilename');
    const downloadBtn = document.getElementById('downloadBtn');
    const ocrToggle = document.getElementById('ocrToggle');
    const languageSelect = document.getElementById('languageSelect');
    
    // API Configuration
    const API_SECRET = 'secret_zEbZHL3lsFzji9vD';
    const API_TOKEN = 'token_t9BMnmYT';
    const API_URL = 'https://v2.convertapi.com/convert/pdf/to/docx';
    
    // File handling
    let selectedFile = null;
    let convertedFileUrl = null;
    
    // Event listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    selectBtn.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.transform = 'translateY(-5px)';
        uploadArea.style.boxShadow = '0 20px 40px rgba(0, 255, 136, 0.3)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.transform = 'translateY(0)';
        uploadArea.style.boxShadow = 'none';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.transform = 'translateY(0)';
        uploadArea.style.boxShadow = 'none';
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileSelect(fileInput.files[0]);
        }
    });
    
    processBtn.addEventListener('click', convertToWord);
    
    // Handle file selection
    function handleFileSelect(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please select a PDF file');
            return;
        }
        
        // Validate file size (max 10MB for ConvertAPI free tier)
        if (file.size > 10 * 1024 * 1024) {
            showError('File size should be less than 10MB');
            return;
        }
        
        selectedFile = file;
        processBtn.disabled = false;
        resultContainer.style.display = 'none';
        
        // Update UI
        const uploadIcon = uploadArea.querySelector('i');
        uploadIcon.className = 'fas fa-file-pdf';
        uploadArea.querySelector('p').textContent = file.name;
        
        // Add RGB pulse effect to process button
        processBtn.style.animation = 'rgbLighting 2s ease infinite';
    }
    
    // Convert PDF to Word
    async function convertToWord() {
        if (!selectedFile) return;
        
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        try {
            const formData = new FormData();
            formData.append('File', selectedFile);
            formData.append('StoreFile', 'true');
            
            // Using both Secret and Token for maximum compatibility
            const response = await fetch(`${API_URL}?auth=${API_SECRET}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            // Get the result file URL from ConvertAPI response
            const result = await response.json();
            if (!result.Files || result.Files.length === 0) {
                throw new Error('No file returned from API');
            }
            
            // Download the converted file
            const convertedFileResponse = await fetch(result.Files[0].Url);
            const blob = await convertedFileResponse.blob();
            
            // Verify file integrity
            if (blob.size < 1024) {
                throw new Error('Invalid file received from API');
            }
            
            // Create download link
            const filename = selectedFile.name.replace(/\.pdf$/i, '') + '.docx';
            convertedFileUrl = URL.createObjectURL(blob);
            downloadBtn.href = convertedFileUrl;
            downloadBtn.download = filename;
            resultFilename.textContent = filename;
            
            // Show result with animation
            resultContainer.style.display = 'block';
            
            // Add RGB effect to download button
            downloadBtn.style.animation = 'rgbLighting 2s ease infinite';
            
        } catch (error) {
            console.error('Conversion error:', error);
            showError('Failed to convert file. Please try again.');
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to Word';
            processBtn.style.animation = '';
        }
    }
    
    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> 
            <span>${message}</span>
        `;
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '30px';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translateX(-50%)';
        errorDiv.style.padding = '15px 25px';
        errorDiv.style.backgroundColor = 'rgba(229, 62, 62, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.display = 'flex';
        errorDiv.style.alignItems = 'center';
        errorDiv.style.gap = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        errorDiv.style.animation = 'fadeIn 0.3s ease-out';
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 5000);
    }
    
    // Clean up object URLs when page unloads
    window.addEventListener('beforeunload', () => {
        if (convertedFileUrl) {
            URL.revokeObjectURL(convertedFileUrl);
        }
    });
    
    // Handle download click to ensure proper file handling
    downloadBtn.addEventListener('click', (e) => {
        if (!convertedFileUrl) {
            e.preventDefault();
            showError('No file available to download');
        }
    });
    
    // Add CSS for error animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, 20px); }
        }
    `;
    document.head.appendChild(style);
});
