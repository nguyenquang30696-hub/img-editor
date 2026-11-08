
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

declare var Cropper: any;

function showNotification(message: string, type: 'info' | 'error' | 'success' = 'info') {
    let toast = document.getElementById('appNotificationToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appNotificationToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '14px';
        toast.style.zIndex = '99999';
        toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.maxWidth = '90vw';
        toast.style.textAlign = 'center';
        toast.style.fontWeight = '500';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? '#7f1d1d' : (type === 'success' ? '#14532d' : '#1e293b');
    toast.style.color = '#fff';
    toast.style.border = `1px solid ${type === 'error' ? '#ef4444' : (type === 'success' ? '#22c55e' : '#64748b')}`;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';

    clearTimeout((toast as any)._timeout);
    (toast as any)._timeout = setTimeout(() => {
        if (toast) {
            toast.style.opacity = '0';
            toast.style.pointerEvents = 'none';
        }
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENT VALIDATION & INITIALIZATION ---
    const getElement = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

    const uploadArea = getElement('uploadArea');
    const fileInput = getElement<HTMLInputElement>('fileInput');
    const imagePreview = getElement<HTMLImageElement>('imagePreview');
    const uploadPlaceholder = getElement('uploadPlaceholder');
    const generateBtn = getElement<HTMLButtonElement>('generateBtn');
    const downloadBtn = getElement<HTMLButtonElement>('downloadBtn');
    const resetBtn = getElement<HTMLButtonElement>('resetBtn');
    const imageGallery = getElement('image-gallery');
    const buttonGroups = document.querySelectorAll('.btn-group');

    // Custom Attire Elements
    const customAttireUploadLabel = getElement<HTMLLabelElement>('customAttireUploadLabel');
    const customAttireUploadInput = getElement<HTMLInputElement>('customAttireUploadInput');
    const customAttireText = getElement('customAttireText');
    const removeCustomAttireBtn = getElement<HTMLButtonElement>('removeCustomAttireBtn');

    // Custom Background Elements
    const customBackgroundUploadLabel = getElement<HTMLLabelElement>('customBackgroundUploadLabel');
    const customBackgroundUploadInput = getElement<HTMLInputElement>('customBackgroundUploadInput');
    const customBackgroundText = getElement('customBackgroundText');
    const removeCustomBackgroundBtn = getElement<HTMLButtonElement>('removeCustomBackgroundBtn');
    
    // Cropper elements
    const cropBtn = getElement<HTMLButtonElement>('cropBtn');
    const cropModal = getElement('cropModal');
    const imageToCrop = getElement<HTMLImageElement>('imageToCrop');
    const cropModalTitle = getElement('cropModalTitle');
    const applyBtn = getElement<HTMLButtonElement>('applyBtn');
    const cancelBtn = getElement<HTMLButtonElement>('cancelBtn');
    const rotateLeftBtn = getElement<HTMLButtonElement>('rotate-left');
    const rotateRightBtn = getElement<HTMLButtonElement>('rotate-right');
    const zoomInBtn = getElement<HTMLButtonElement>('zoom-in');
    const zoomOutBtn = getElement<HTMLButtonElement>('zoom-out');
    const rotationSlider = getElement<HTMLInputElement>('rotation-slider');
    const rotationValue = getElement('rotation-value');
    
    // Beautify feature elements
    const beautifyControls = getElement('beautify-controls');
    const beautifyToggle = getElement<HTMLInputElement>('beautifyToggle');
    const beautifySliderContainer = getElement('beautifySliderContainer');
    const beautifySlider = getElement<HTMLInputElement>('beautify-slider');
    const beautifyValue = getElement('beautify-value');
    const brightenSlider = getElement<HTMLInputElement>('brighten-slider');
    const brightenValue = getElement('brighten-value');
    
    // Custom Prompt element
    const customPromptInput = getElement<HTMLTextAreaElement>('customPromptInput');

    // Print Layout Elements
    const printLayoutContainer = getElement('printLayoutContainer');
    const layout3x4Btn = getElement<HTMLButtonElement>('layout-3x4-btn');
    const layout4x6Btn = getElement<HTMLButtonElement>('layout-4x6-btn');
    const layoutComboBtn = getElement<HTMLButtonElement>('layout-combo-btn');
    const printCanvas = getElement<HTMLCanvasElement>('printCanvas');
    const downloadLayoutBtn = getElement<HTMLButtonElement>('downloadLayoutBtn');
    const printLayoutBtn = getElement<HTMLButtonElement>('printLayoutBtn');

    // API Modal Elements
    const apiSettingsBtn = getElement<HTMLButtonElement>('apiSettingsBtn');
    const apiKeyBadge = getElement('apiKeyBadge');
    const apiModal = getElement('apiModal');
    const closeApiModalBtn = getElement<HTMLButtonElement>('closeApiModalBtn');
    const cancelApiModalBtn = getElement<HTMLButtonElement>('cancelApiModalBtn');
    const saveApiSettingsBtn = getElement<HTMLButtonElement>('saveApiSettingsBtn');
    const clearApiKeysBtn = getElement<HTMLButtonElement>('clearApiKeysBtn');
    const testApiKeysBtn = getElement<HTMLButtonElement>('testApiKeysBtn');
    const testKeyFeedback = getElement('testKeyFeedback');
    const modelSelect = getElement<HTMLSelectElement>('modelSelect');
    const apiKeysInput = getElement<HTMLTextAreaElement>('apiKeysInput');
    const activeKeyStatus = getElement('activeKeyStatus');
    const roundRobinStatusText = getElement('roundRobinStatusText');

    if (
        !uploadArea || !fileInput || !imagePreview || !uploadPlaceholder ||
        !generateBtn || !downloadBtn || !resetBtn || !imageGallery ||
        !customAttireUploadLabel || !customAttireUploadInput || !customAttireText ||
        !removeCustomAttireBtn || buttonGroups.length === 0 ||
        !customBackgroundUploadLabel || !customBackgroundUploadInput || !customBackgroundText ||
        !removeCustomBackgroundBtn ||
        !cropBtn || !cropModal || !imageToCrop || !cropModalTitle || !applyBtn || !cancelBtn ||
        !rotateLeftBtn || !rotateRightBtn || !zoomInBtn || !zoomOutBtn ||
        !rotationSlider || !rotationValue ||
        !beautifyControls || !beautifyToggle || !beautifySliderContainer || !beautifySlider || !beautifyValue || !brightenSlider || !brightenValue ||
        !customPromptInput ||
        !printLayoutContainer || !layout3x4Btn || !layout4x6Btn || !layoutComboBtn || !printCanvas || !downloadLayoutBtn || !printLayoutBtn
    ) {
        console.error('One or more essential HTML elements are missing. Application cannot start.');
        return;
    }
    
    const initialGalleryHTML = imageGallery.innerHTML;

    // --- API KEYS & ROUND-ROBIN STATE ---
    let userApiKeys: string[] = [];
    let currentKeyRoundRobinIndex = 0;
    let userSelectedModel = 'gemini-3.1-flash-lite-image';

    function sanitizeKey(k?: string): string {
        if (!k) return '';
        return k.trim().replace(/^[;,\s"']+|[;,\s"']+$/g, '');
    }

    function loadApiSettings() {
        try {
            const storedKeys = localStorage.getItem('ken_gemini_api_keys');
            if (storedKeys) {
                userApiKeys = JSON.parse(storedKeys);
                if (Array.isArray(userApiKeys)) {
                    userApiKeys = userApiKeys.map(sanitizeKey).filter(Boolean);
                } else {
                    userApiKeys = [];
                }
            }
            const storedModel = localStorage.getItem('ken_gemini_selected_model');
            if (storedModel) {
                userSelectedModel = storedModel;
            }
            const storedIndex = localStorage.getItem('ken_gemini_key_index');
            if (storedIndex) {
                currentKeyRoundRobinIndex = parseInt(storedIndex, 10) || 0;
            }
        } catch (e) {
            console.error('Error loading API settings from localStorage:', e);
        }
        updateApiUI();
    }

    function updateApiUI() {
        if (apiKeyBadge) {
            if (userApiKeys.length > 0) {
                apiKeyBadge.textContent = `${userApiKeys.length} keys`;
                apiKeyBadge.classList.add('custom');
            } else {
                apiKeyBadge.textContent = 'Auto';
                apiKeyBadge.classList.remove('custom');
            }
        }

        if (activeKeyStatus) {
            if (userApiKeys.length > 0) {
                activeKeyStatus.textContent = `Đang dùng: ${userApiKeys.length} key riêng (Round-Robin)`;
            } else {
                activeKeyStatus.textContent = 'Đang dùng: Mặc định môi trường';
            }
        }

        if (roundRobinStatusText) {
            if (userApiKeys.length > 0) {
                const nextNum = (currentKeyRoundRobinIndex % userApiKeys.length) + 1;
                roundRobinStatusText.textContent = `🔁 Xoay vòng: Tổng ${userApiKeys.length} key • Lần tạo tiếp theo sẽ dùng Key #${nextNum}`;
            } else {
                roundRobinStatusText.textContent = '🔁 Trạng thái: Chưa có key riêng (dùng key môi trường)';
            }
        }

        if (modelSelect) {
            modelSelect.value = userSelectedModel;
        }

        if (apiKeysInput) {
            apiKeysInput.value = userApiKeys.join('\n');
        }
    }

    function openApiModal() {
        updateApiUI();
        if (testKeyFeedback) testKeyFeedback.classList.add('hidden');
        if (apiModal) apiModal.classList.remove('hidden');
    }

    function closeApiModal() {
        if (apiModal) apiModal.classList.add('hidden');
    }

    function saveApiSettings() {
        if (modelSelect) {
            userSelectedModel = modelSelect.value;
            localStorage.setItem('ken_gemini_selected_model', userSelectedModel);
        }

        if (apiKeysInput) {
            const raw = apiKeysInput.value;
            const parsed = raw
                .split(/[\n,;]+/)
                .map(sanitizeKey)
                .filter(k => k.length > 0 && !k.startsWith('#'));
            userApiKeys = parsed;
            localStorage.setItem('ken_gemini_api_keys', JSON.stringify(userApiKeys));
        }

        currentKeyRoundRobinIndex = 0;
        localStorage.setItem('ken_gemini_key_index', '0');

        updateApiUI();
        closeApiModal();
        if (userApiKeys.length > 0) {
            showNotification(`Đã lưu ${userApiKeys.length} API key (xoay vòng Round-Robin). Model: ${userSelectedModel}`, 'success');
        } else {
            showNotification(`Đã lưu cài đặt. Sử dụng key môi trường. Model: ${userSelectedModel}`, 'info');
        }
    }

    function clearApiKeys() {
        userApiKeys = [];
        localStorage.removeItem('ken_gemini_api_keys');
        currentKeyRoundRobinIndex = 0;
        localStorage.setItem('ken_gemini_key_index', '0');
        if (apiKeysInput) apiKeysInput.value = '';
        if (testKeyFeedback) testKeyFeedback.classList.add('hidden');
        updateApiUI();
        showNotification('Đã xóa danh sách API key riêng. Ứng dụng sẽ dùng key môi trường.', 'info');
    }

    async function testKeyConnection() {
        if (!testKeyFeedback) return;
        const currentModel = modelSelect?.value || userSelectedModel;
        let testKey = '';
        if (apiKeysInput && apiKeysInput.value.trim()) {
            const raw = apiKeysInput.value;
            const parsed = raw
                .split(/[\n,;]+/)
                .map(sanitizeKey)
                .filter(k => k.length > 0 && !k.startsWith('#'));
            if (parsed.length > 0) testKey = parsed[0];
        } else if (userApiKeys.length > 0) {
            testKey = userApiKeys[0];
        }

        testKeyFeedback.className = 'test-feedback-box loading';
        testKeyFeedback.innerHTML = `⏳ Đang kiểm tra kết nối với Google Gemini API (Model: <strong>${currentModel}</strong>)...`;
        testKeyFeedback.classList.remove('hidden');

        try {
            const res = await fetch('/api/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: testKey,
                    model: currentModel
                })
            });
            const data = await res.json();
            if (data.success) {
                testKeyFeedback.className = 'test-feedback-box success';
                testKeyFeedback.innerHTML = `✅ <strong>Thành công!</strong> ${data.message}`;
            } else if (data.code === 429 || data.errorType === 'FREE_TIER_NO_QUOTA') {
                testKeyFeedback.className = 'test-feedback-box error';
                testKeyFeedback.innerHTML = `⚠️ <strong>Hạn mức Free Tier = 0:</strong> Key này hợp lệ nhưng đang ở gói Free Tier của Google AI Studio. Để tạo ảnh (model ${currentModel}), tài khoản Google của bạn cần kích hoạt <strong>Billing (Pay-as-you-go)</strong> tại <a href="https://aistudio.google.com" target="_blank" style="color: #93c5fd; text-decoration: underline;">aistudio.google.com</a>.`;
            } else {
                testKeyFeedback.className = 'test-feedback-box error';
                testKeyFeedback.innerHTML = `❌ <strong>Thất bại:</strong> ${data.message || 'Không thể xác thực key.'}`;
            }
        } catch (e: any) {
            testKeyFeedback.className = 'test-feedback-box error';
            testKeyFeedback.innerHTML = `❌ <strong>Lỗi mạng:</strong> ${e.message || 'Không thể kết nối đến máy chủ.'}`;
        }
    }

    function getNextRoundRobinKey(): { key: string | null; keyNum: number; total: number } {
        if (userApiKeys.length === 0) {
            return { key: null, keyNum: 0, total: 0 };
        }
        const idx = currentKeyRoundRobinIndex % userApiKeys.length;
        const key = sanitizeKey(userApiKeys[idx]);
        currentKeyRoundRobinIndex = (currentKeyRoundRobinIndex + 1) % userApiKeys.length;
        localStorage.setItem('ken_gemini_key_index', currentKeyRoundRobinIndex.toString());
        updateApiUI();
        return { key, keyNum: idx + 1, total: userApiKeys.length };
    }

    if (apiSettingsBtn) apiSettingsBtn.addEventListener('click', openApiModal);
    if (closeApiModalBtn) closeApiModalBtn.addEventListener('click', closeApiModal);
    if (cancelApiModalBtn) cancelApiModalBtn.addEventListener('click', closeApiModal);
    if (saveApiSettingsBtn) saveApiSettingsBtn.addEventListener('click', saveApiSettings);
    if (clearApiKeysBtn) clearApiKeysBtn.addEventListener('click', clearApiKeys);
    if (testApiKeysBtn) testApiKeysBtn.addEventListener('click', testKeyConnection);

    if (apiModal) {
        apiModal.addEventListener('click', (e) => {
            if (e.target === apiModal) closeApiModal();
        });
    }
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && apiModal && !apiModal.classList.contains('hidden')) {
            closeApiModal();
        }
    });

    // Load API settings on start
    loadApiSettings();

    // App State
    let downloadableImageUrl: string | null = null;
    let cropper: any = null;
    let cropContext: 'main' | 'attire' | 'background' = 'main';
    let tempAttireFilename = '';
    let tempBackgroundFilename = '';

    const defaultOptions = {
        gender: 'nu',
        subject: 'nguoi-lon',
        attire: 'ao-so-mi',
        hairstyle: 'gon-gang',
        background: 'xanh',
    };
    const state = {
        image: {
            data: '',
            mimeType: '',
            width: 0,
            height: 0,
        },
        customAttire: {
            data: '',
            mimeType: '',
            filename: ''
        },
        customBackground: {
            data: '',
            mimeType: '',
            filename: ''
        },
        options: { ...defaultOptions },
        beautify: {
            isEnabled: true,
            level: 50,
            brightenLevel: 0,
        },
        customPrompt: ''
    };
    
    // --- 1. FILE UPLOAD HANDLING ---

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    uploadArea.addEventListener('dragenter', () => uploadArea.classList.add('drag-over'));
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e: DragEvent) => {
        uploadArea.classList.remove('drag-over');
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            handleFile(dt.files[0]);
        }
    });

    function handleFile(file: File) {
        if (!file.type.startsWith('image/')) {
            showNotification('Vui lòng chọn một file ảnh.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (!result) return;
            
            updateImageAndState(result);
            cropBtn.classList.remove('hidden');
            generateBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Updates the preview image, the base64 data, and dimensions in the state.
     * @param {string} imageDataUrl - The base64 image data URL.
     */
    function updateImageAndState(imageDataUrl: string) {
        imagePreview.src = imageDataUrl;
        imagePreview.classList.remove('image-preview-hidden');
        uploadPlaceholder.style.display = 'none';

        const parts = imageDataUrl.split(';base64,');
        state.image.mimeType = parts[0].split(':')[1];
        state.image.data = parts[1];

        // Get image dimensions and store them in the state. This is crucial for
        // prompting the AI to generate an image with the exact same size.
        const img = new Image();
        img.onload = () => {
            state.image.width = img.width;
            state.image.height = img.height;
        };
        img.src = imageDataUrl;
    }
    
    // --- 1.5 CROPPER/MODAL HANDLING ---

    /**
     * Opens and configures the cropping modal.
     * @param {string} imageUrl The URL of the image to crop.
     * @param {'main' | 'attire' | 'background'} context The cropping context.
     * @param {object} cropperOptions Options for the Cropper.js instance.
     */
    function openCropModal(imageUrl: string, context: 'main' | 'attire' | 'background', cropperOptions: any) {
        cropContext = context;
        imageToCrop.src = imageUrl;

        const mainControls = document.querySelectorAll('.main-image-crop-controls');
        
        if (context === 'main') {
            cropModalTitle.textContent = 'Cắt & Xoay ảnh';
            mainControls.forEach(el => (el as HTMLElement).style.display = 'flex');
            rotationSlider.value = '0';
            if (rotationValue) rotationValue.textContent = '0°';
        } else if (context === 'attire') {
            cropModalTitle.textContent = 'Cắt Trang Phục (Tỷ lệ 10x15)';
            mainControls.forEach(el => (el as HTMLElement).style.display = 'none');
        } else { // context === 'background'
            cropModalTitle.textContent = 'Cắt Nền Tham Chiếu';
            mainControls.forEach(el => (el as HTMLElement).style.display = 'none');
        }

        cropModal.classList.remove('hidden');

        const finalOptions = {
            viewMode: 1,
            dragMode: 'move',
            background: false,
            autoCropArea: 0.9,
            zoomOnWheel: true,
            ...cropperOptions
        };

        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(imageToCrop, finalOptions);
    }

    cropBtn.addEventListener('click', () => {
        openCropModal(imagePreview.src, 'main', { aspectRatio: 10 / 15 });
    });

    function closeModal() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropModal.classList.add('hidden');
    }

    cancelBtn.addEventListener('click', closeModal);

    applyBtn.addEventListener('click', () => {
        if (!cropper) return;
        
        const canvas = cropper.getCroppedCanvas({
            imageSmoothingQuality: 'high',
        });
        const finalImageUrl = canvas.toDataURL('image/jpeg');

        if (cropContext === 'main') {
            updateImageAndState(finalImageUrl);
        } else if (cropContext === 'attire') {
            const parts = finalImageUrl.split(';base64,');
            state.customAttire = {
                mimeType: parts[0].split(':')[1],
                data: parts[1],
                filename: tempAttireFilename,
            };
            updateCustomAttireUI(tempAttireFilename);
        } else { // cropContext === 'background'
             const parts = finalImageUrl.split(';base64,');
            state.customBackground = {
                mimeType: parts[0].split(':')[1],
                data: parts[1],
                filename: tempBackgroundFilename,
            };
            updateCustomBackgroundUI(tempBackgroundFilename);
        }
        
        closeModal();
    });

    rotateLeftBtn.addEventListener('click', () => { if(cropper) cropper.rotate(-45); });
    rotateRightBtn.addEventListener('click', () => { if(cropper) cropper.rotate(45); });
    zoomInBtn.addEventListener('click', () => { if(cropper) cropper.zoom(0.1); });
    zoomOutBtn.addEventListener('click', () => { if(cropper) cropper.zoom(-0.1); });

    rotationSlider.addEventListener('input', () => {
        if (cropper) {
            const degrees = parseInt(rotationSlider.value, 10);
            cropper.rotateTo(degrees);
            if (rotationValue) rotationValue.textContent = `${degrees}°`;
        }
    });

    // --- 2. OPTION SELECTION HANDLING ---

    // Beautify feature event listeners
    function updateBeautifyState() {
        const isEnabled = beautifyToggle.checked;
        state.beautify.isEnabled = isEnabled;
        beautifySlider.disabled = !isEnabled;
        if (isEnabled) {
            beautifySliderContainer.classList.remove('disabled');
        } else {
            beautifySliderContainer.classList.add('disabled');
        }
    }

    beautifyToggle.addEventListener('change', updateBeautifyState);

    beautifySlider.addEventListener('input', () => {
        const level = parseInt(beautifySlider.value, 10);
        state.beautify.level = level;
        if (beautifyValue) beautifyValue.textContent = `${level}%`;
    });

    brightenSlider.addEventListener('input', () => {
        const level = parseInt(brightenSlider.value, 10);
        state.beautify.brightenLevel = level;
        if (brightenValue) brightenValue.textContent = `${level}%`;
    });
    
    // Custom Prompt listener
    customPromptInput.addEventListener('input', () => {
        state.customPrompt = customPromptInput.value;
    });

    // Set initial state
    updateBeautifyState();

    buttonGroups.forEach(group => {
        const initialKey = group.id as keyof typeof defaultOptions;
        if (initialKey in defaultOptions) {
            const initialActive = group.querySelector(`[data-value="${defaultOptions[initialKey]}"]`);
            if (initialActive) initialActive.classList.add('active');
        }

        group.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const buttonTarget = target.closest<HTMLElement>('.option-btn');

            if (buttonTarget && !buttonTarget.id.startsWith('custom')) {
                // Deactivate custom options if a different option in the same group is chosen
                if (group.id === 'attire' && state.customAttire.data) {
                    removeCustomAttire(false);
                }
                if (group.id === 'background' && state.customBackground.data) {
                    removeCustomBackground(false);
                }

                group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
                buttonTarget.classList.add('active');

                const key = group.id as keyof typeof state.options;
                const value = buttonTarget.dataset.value;
                if (value && key in state.options) {
                    state.options[key] = value as any;
                }
            }
        });
    });

    // --- 2.5 CUSTOM UPLOAD HANDLING (Attire & Background) ---
    
    function handleCustomAttireFile(file: File) {
        if (!file.type.startsWith('image/')) {
            showNotification('Vui lòng chọn một file ảnh cho trang phục.', 'error');
            return;
        }
        tempAttireFilename = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (!result) return;
            openCropModal(result, 'attire', { aspectRatio: 10 / 15 });
        };
        reader.readAsDataURL(file);
    }

    function updateCustomAttireUI(filename: string) {
        state.options.attire = 'custom';
        const attireGroup = document.getElementById('attire');
        if (attireGroup) {
            attireGroup.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        }
        customAttireUploadLabel.classList.add('active');
        customAttireText.textContent = filename;
        customAttireText.title = filename;
        customAttireText.classList.remove('default-text');
        removeCustomAttireBtn.style.display = 'inline-flex';
    }
    
    customAttireUploadInput.addEventListener('change', () => {
        if (customAttireUploadInput.files && customAttireUploadInput.files[0]) {
            handleCustomAttireFile(customAttireUploadInput.files[0]);
        }
    });

    function removeCustomAttire(resetToDefault = true) {
        state.customAttire = { data: '', mimeType: '', filename: '' };
        customAttireUploadInput.value = '';
        customAttireUploadLabel.classList.remove('active');
        customAttireText.textContent = 'Thêm trang phục ➕';
        customAttireText.classList.add('default-text');
        customAttireText.title = '';
        removeCustomAttireBtn.style.display = 'none';
        tempAttireFilename = '';

        if (resetToDefault) {
             state.options.attire = defaultOptions.attire;
             const attireGroup = document.getElementById('attire');
             if (attireGroup) {
                 const defaultBtn = attireGroup.querySelector(`[data-value="${defaultOptions.attire}"]`) as HTMLElement;
                 if (defaultBtn) defaultBtn.classList.add('active');
             }
        }
    }

    removeCustomAttireBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeCustomAttire(true);
    });

    function handleCustomBackgroundFile(file: File) {
        if (!state.image.data) {
            showNotification('Vui lòng tải ảnh chính lên trước khi chọn nền tham chiếu.', 'error');
            customBackgroundUploadInput.value = ''; 
            return;
        }
        if (!file.type.startsWith('image/')) {
            showNotification('Vui lòng chọn một file ảnh cho nền.', 'error');
            return;
        }
        tempBackgroundFilename = file.name;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (!result) return;
            const cropperOptions = { 
                aspectRatio: state.image.width && state.image.height 
                    ? state.image.width / state.image.height 
                    : null
            };
            openCropModal(result, 'background', cropperOptions);
        };
        reader.readAsDataURL(file);
    }

    function updateCustomBackgroundUI(filename: string) {
        state.options.background = 'nen-tham-chieu';
        const backgroundGroup = document.getElementById('background');
        if (backgroundGroup) {
            backgroundGroup.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        }
        customBackgroundUploadLabel.classList.add('active');
        customBackgroundText.textContent = filename;
        customBackgroundText.title = filename;
        customBackgroundText.classList.remove('default-text');
        removeCustomBackgroundBtn.style.display = 'inline-flex';
    }

    customBackgroundUploadInput.addEventListener('change', () => {
        if (customBackgroundUploadInput.files && customBackgroundUploadInput.files[0]) {
            handleCustomBackgroundFile(customBackgroundUploadInput.files[0]);
        }
    });

    function removeCustomBackground(resetToDefault = true) {
        state.customBackground = { data: '', mimeType: '', filename: '' };
        customBackgroundUploadInput.value = '';
        customBackgroundUploadLabel.classList.remove('active');
        customBackgroundText.textContent = 'Nền Tham Chiếu ➕';
        customBackgroundText.classList.add('default-text');
        customBackgroundText.title = '';
        removeCustomBackgroundBtn.style.display = 'none';
        tempBackgroundFilename = '';
    
        if (resetToDefault) {
            state.options.background = defaultOptions.background;
            const backgroundGroup = document.getElementById('background');
            if (backgroundGroup) {
                const defaultBtn = backgroundGroup.querySelector(`[data-value="${defaultOptions.background}"]`) as HTMLElement;
                if (defaultBtn) defaultBtn.classList.add('active');
            }
        }
    }
    
    removeCustomBackgroundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeCustomBackground(true);
    });

    // --- 3. AI IMAGE GENERATION ---

    generateBtn.addEventListener('click', async () => {
        if (!state.image.data) {
            showNotification('Vui lòng tải lên một hình ảnh trước.', 'error');
            return;
        }
        if (state.options.attire === 'custom' && !state.customAttire.data) {
            showNotification('Vui lòng chọn một file ảnh trang phục hoặc chọn một kiểu trang phục khác.', 'error');
            return;
        }
        if (state.options.background === 'nen-tham-chieu' && !state.customBackground.data) {
            showNotification('Vui lòng chọn một file ảnh nền hoặc chọn một kiểu nền khác.', 'error');
            return;
        }

        setLoadingState(true);

        try {
            const prompt = createPrompt();
            const textPart = { text: prompt };
            const imagePart = {
                inlineData: { data: state.image.data, mimeType: state.image.mimeType }
            };

            const parts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [textPart, imagePart];

            if (state.options.attire === 'custom' && state.customAttire.data) {
                 const customAttirePart = {
                    inlineData: { data: state.customAttire.data, mimeType: state.customAttire.mimeType }
                };
                parts.push(customAttirePart);
            }
            if (state.options.background === 'nen-tham-chieu' && state.customBackground.data) {
                const customBackgroundPart = {
                   inlineData: { data: state.customBackground.data, mimeType: state.customBackground.mimeType }
               };
               parts.push(customBackgroundPart);
           }
            
            let attempts = 0;
            const maxAttempts = Math.max(1, userApiKeys.length);
            let success = false;
            let lastError = 'Không thể tạo ảnh. Vui lòng thử lại.';

            while (attempts < maxAttempts && !success) {
                attempts++;
                const { key, keyNum, total } = getNextRoundRobinKey();

                const btnText = generateBtn.querySelector('.btn-text');
                if (btnText && total > 0) {
                    btnText.textContent = `Đang tạo (Key #${keyNum}/${total})...`;
                }

                try {
                    const response = await fetch('/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parts,
                            apiKey: key,
                            model: userSelectedModel
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        const errMsg = data.error || 'Lỗi từ máy chủ tạo ảnh.';
                        lastError = errMsg;
                        const isQuotaOrLimit = response.status === 429 ||
                            response.status === 403 ||
                            errMsg.includes('429') ||
                            errMsg.includes('RESOURCE_EXHAUSTED') ||
                            errMsg.includes('quota') ||
                            errMsg.includes('rate');

                        if (isQuotaOrLimit && attempts < maxAttempts) {
                            showNotification(`Key #${keyNum} gặp hạn mức. Đang tự động xoay vòng sang Key tiếp theo...`, 'info');
                            continue;
                        }
                        throw new Error(errMsg);
                    }

                    if (data.imageUrl) {
                        displayResults([data.imageUrl]);
                        success = true;
                        if (total > 0) {
                            showNotification(`Tạo ảnh thành công với Key #${keyNum}/${total} (${userSelectedModel})`, 'success');
                        }
                    } else {
                        throw new Error(data.error || "Không nhận được ảnh kết quả từ AI.");
                    }

                } catch (err: any) {
                    lastError = err.message || lastError;
                    if (attempts >= maxAttempts) {
                        throw new Error(lastError);
                    }
                }
            }

        } catch (error: any) {
            console.error("Error generating image:", error);
            displayError(error.message || "Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.");
        } finally {
            setLoadingState(false);
        }
    });

    // --- 4. DOWNLOAD HANDLING ---

    downloadBtn.addEventListener('click', () => {
        if (!downloadableImageUrl) return;

        const link = document.createElement('a');
        link.href = downloadableImageUrl;
        link.download = 'anh the Kenle.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // --- 5. RESET HANDLING ---

    function resetApplication() {
        // Reset Image Upload
        imagePreview.src = '#';
        imagePreview.classList.add('image-preview-hidden');
        uploadPlaceholder.style.display = 'flex';
        fileInput.value = '';
        state.image.data = '';
        state.image.mimeType = '';
        state.image.width = 0;
        state.image.height = 0;
        cropBtn.classList.add('hidden');

        // Reset Custom Uploads
        removeCustomAttire(false);
        removeCustomBackground(false);

        // Reset Beautify Controls
        beautifyToggle.checked = true;
        beautifySlider.value = '50';
        if (beautifyValue) beautifyValue.textContent = '50%';
        state.beautify.level = 50;
        brightenSlider.value = '0';
        if (brightenValue) brightenValue.textContent = '0%';
        state.beautify.brightenLevel = 0;
        updateBeautifyState();

        // Reset Custom Prompt
        customPromptInput.value = '';
        state.customPrompt = '';

        // Reset Options
        Object.assign(state.options, defaultOptions);
        buttonGroups.forEach(group => {
            group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
            const key = group.id as keyof typeof defaultOptions;
            if (key in defaultOptions) {
                const defaultBtn = group.querySelector(`[data-value="${defaultOptions[key]}"]`);
                if (defaultBtn) defaultBtn.classList.add('active');
            }
        });

        // Reset Gallery
        imageGallery.innerHTML = initialGalleryHTML;
        imageGallery.classList.remove('single-view');
        downloadableImageUrl = null;

        // Reset Print Layout
        printLayoutContainer.classList.add('hidden');
        printCanvas.classList.add('hidden');
        const ctx = printCanvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, printCanvas.width, printCanvas.height);
        }
        downloadLayoutBtn.classList.add('hidden');
        downloadLayoutBtn.disabled = true;
        printLayoutBtn.classList.add('hidden');
        printLayoutBtn.disabled = true;
        sourceImage = null;

        // Reset Buttons
        generateBtn.disabled = true;
        downloadBtn.disabled = true;
    }

    resetBtn.addEventListener('click', resetApplication);


    // --- 6. HELPER FUNCTIONS ---

    /**
     * Generates a descriptive prompt for skin smoothing based on a 0-100 level.
     * @param {number} level The beautification level from the slider.
     * @returns {string} A descriptive instruction for the AI.
     */
    function getBeautifyPromptText(level: number): string {
        if (level === 0) return '';
        if (level <= 30) {
            return `\n- YÊU CẦU LÀM ĐẸP DA (NHẸ): Làm mịn da một cách tự nhiên, loại bỏ các khuyết điểm rất nhỏ, làm đều màu da nhẹ nhàng. Giữ lại tối đa cấu trúc da thật.`;
        }
        if (level <= 70) {
            return `\n- YÊU CẦU LÀM ĐẸP DA (VỪA): Làm mịn da rõ rệt, loại bỏ hoàn toàn các khuyết điểm nhỏ và vừa như mụn, vết thâm. Cân bằng lại màu da. QUAN TRỌNG: Phải giữ lại cấu trúc da tự nhiên, không làm da bị giả tạo như tượng sáp.`;
        }
        // level > 70
        return `\n- YÊU CẦU LÀM ĐẸP DA (MẠNH): Xử lý da kỹ lưỡng, chuyên nghiệp. Loại bỏ triệt để tất cả các khuyết điểm trên da mặt như mụn, sẹo nhỏ, vết thâm, nếp nhăn nông. Làm cho làn da trở nên mịn màng, đều màu và hoàn hảo. Đảm bảo khuôn mặt không bị bệt, mất khối và vẫn giữ được nét chân thực.`;
    }
    
    /**
     * Generates a descriptive prompt for skin brightening based on a 0-100 level.
     * @param {number} level The brightening level from the slider.
     * @returns {string} A descriptive instruction for the AI.
     */
    function getBrightenPromptText(level: number): string {
        if (level === 0) return '';
        if (level <= 30) {
            // NHẸ (Subtle)
            return `\n- YÊU CẦU LÀM SÁNG & ĐỀU MÀU DA (NHẸ): Nâng tông da một cách tinh tế, làm đều các vùng da không đều màu nhẹ. Giúp khuôn mặt trông rạng rỡ và có sức sống hơn một chút, hiệu ứng phải cực kỳ tự nhiên.`;
        }
        if (level <= 70) {
            // VỪA (Medium)
            return `\n- YÊU CẦU LÀM SÁNG & ĐỀU MÀU DA (VỪA): Làm sáng da mặt một cách rõ rệt, nâng tông da lên đáng kể. QUAN TRỌNG: Phải làm đều màu da toàn diện, loại bỏ các vùng da tối, sạm màu do ánh sáng không đều. Kết quả là một làn da trắng sáng, mịn màng và đều màu. Đảm bảo các vùng sáng không bị cháy sáng (overexposed) và vẫn giữ được chi tiết.`;
        }
        // MẠNH (Strong)
        return `\n- YÊU CẦU LÀM SÁNG & ĐỀU MÀU DA (MẠNH): Tăng độ sáng da mặt một cách mạnh mẽ, tạo hiệu ứng "bật tone" rõ rệt. Xử lý chuyên sâu để làm đều màu da một cách hoàn hảo, loại bỏ tất cả các vùng da không đều màu, mang lại một làn da trắng sáng không tì vết. Ánh sáng trên khuôn mặt phải được cân bằng lại để tạo cảm giác da sáng bóng, khỏe mạnh và nổi bật. TUYỆT ĐỐI không làm mất chi tiết ở các vùng highlight (như trán, sống mũi, cằm).`;
    }

    function createPrompt(): string {
        const { gender, subject, attire, hairstyle, background } = state.options;

        // --- Helper Functions ---
        const getBackgroundInstruction = (): string => {
            if (background === 'giu-nguyen') {
                return 'Giữ nguyên phông nền gốc.';
            }
            if (background === 'nen-tham-chieu') {
                return 'QUAN TRỌNG: Tách chủ thể ra khỏi nền một cách hoàn hảo. Xóa bỏ 100% phông nền gốc. Sau đó, thay thế bằng phông nền được cung cấp trong ảnh tham chiếu nền. Việc ghép nền phải tự nhiên, phù hợp với ánh sáng và phối cảnh của chủ thể.';
            }
            const colorMap: { [key: string]: string } = {
                'xanh': 'xanh dương',
                'trang': 'trắng',
                'xam': 'xám nhạt'
            };
            const backgroundColorText = colorMap[background] || background;
            return `QUAN TRỌNG: Tách chủ thể ra khỏi nền một cách hoàn hảo. Xóa bỏ 100% phông nền gốc, bao gồm cả bóng đổ và các chi tiết không đồng đều. Sau đó, thay thế bằng một phông nền TRƠN, ĐỒNG NHẤT, SẠCH SẼ màu ${backgroundColorText}. Nền mới không được có bất kỳ gradient, họa tiết hay bóng đổ nào.`;
        };

        const getHairstyleText = (hairstyleValue: string): string => {
            const map: { [key: string]: string } = {
                'gon-gang': 'gọn gàng',
                'toc-ngan': 'tóc ngắn',
                'toc-dai': 'tóc dài',
                'toc-dai-bong-benh': 'tóc dài bồng bềnh, óng ả và có độ phồng tự nhiên',
                'thoi-trang': 'tóc thời trang',
                'buoc-gon': 'tóc buộc gọn',
                'texture-crop-nam': 'kiểu tóc nam Textured Crop, với phần tóc trên được cắt tỉa tạo nhiều lớp và kết cấu',
                're-doi-hq-nam': 'kiểu tóc nam ngắn, rẽ ngôi giữa theo phong cách Hàn Quốc. Phần mái dài vừa phải, uốn nhẹ và buông tự nhiên sang hai bên. Đặc biệt, phần tóc hai bên thái dương và sau gáy phải được cắt ngắn gọn gàng để tạo sự tương phản và làm nổi bật phần tóc mái. Kiểu tóc này cần có độ phồng nhẹ, trông hiện đại và lãng tử.',
                'xoan-ngan-nam': 'kiểu tóc nam ngắn xoăn nhẹ phần mái, có màu đen nâu sáng, tạo cảm giác bồng bềnh và lãng tử, hai bên và gáy được cắt ngắn gọn gàng',
                'hat-de-ngo-nam': 'kiểu tóc nam cắt ngắn gọn gàng, còn được gọi là tóc "hạt dẻ" hoặc kiểu tóc của Park Sae-ro-yi trong phim Itaewon Class. Đặc trưng là phần mái được cắt rất ngắn và bằng, tạo vẻ ngoài cá tính, mạnh mẽ và một chút ngố. QUAN TRỌNG: Màu tóc phải là màu đen tự nhiên của người châu Á.'
            };
            return map[hairstyleValue] || hairstyleValue.replace(/-/g, ' ');
        };
        
        const getSubjectText = (subjectValue: string): string => {
            switch (subjectValue) {
                case 'tre-em': return 'trẻ em';
                case 'thanh-nien': return 'thanh niên';
                default: return 'người lớn';
            }
        };

        const getAttireText = (attireValue: string): string => {
            const map: { [key: string]: string } = {
                'ao-so-mi': 'áo sơ mi',
                'ao-so-mi-trang': 'áo sơ mi trắng',
                'ao-polo': 'áo polo',
                'ao-phong-tron': 'áo phông trơn',
                'ao-vest': 'áo vest',
                'vest-nu-cong-so-1': 'một bộ vest công sở nữ màu xanh navy với hai cúc, bên trong là áo sơ mi trắng có đường kẻ đen trang trí ở giữa',
                'vest-nu-cong-so-2': 'một bộ vest công sở nữ màu đen một cúc, bên trong là áo sơ mi trắng có nơ lụa trắng to bản ở cổ',
                'ao-trang-khan-quang': 'áo trắng và khăn quàng đỏ',
                'ao-dai-trang': 'áo dài trắng',
                'nu-sinh-hq-1': 'phần thân trên của đồng phục nữ sinh Hàn Quốc bao gồm áo khoác vest xám, sơ mi trắng có nơ hồng. Chỉ tạo ảnh chụp từ ngực trở lên.',
                'nu-sinh-hq-2': 'phần thân trên của đồng phục nữ sinh Hàn Quốc, bao gồm áo khoác vest xám hai hàng cúc, sơ mi trắng, và nơ kẻ sọc xanh trắng. Chỉ tạo ảnh chụp từ ngực trở lên.',
                'nu-sinh-hq-3': 'phần thân trên của đồng phục nữ sinh Hàn Quốc, bao gồm áo khoác vest màu xanh navy, sơ mi trắng, và một chiếc cà vạt màu đen. Chỉ tạo ảnh chụp từ ngực trở lên.'
            };
            return map[attireValue] || attireValue.replace(/-/g, ' ');
        };
        
        // --- PROMPT CONSTRUCTION ---

        const hasCustomAttire = attire === 'custom' && state.customAttire.data;
        const hasCustomBackground = background === 'nen-tham-chieu' && state.customBackground.data;
        
        let imageUsageDescription = "Chỉnh sửa ảnh chân dung của người mẫu (ảnh đầu tiên).";
        let attireDataSource = "";
        let backgroundDataSource = "";
        let imageIndex = 1;

        if (hasCustomAttire) {
            imageIndex++;
            attireDataSource = `sử dụng ảnh thứ ${imageIndex} làm trang phục`;
        }
        if (hasCustomBackground) {
            imageIndex++;
            backgroundDataSource = `sử dụng ảnh thứ ${imageIndex} làm nền`;
        }

        const descriptions = [attireDataSource, backgroundDataSource].filter(Boolean);
        if (descriptions.length > 0) {
            imageUsageDescription = `Chỉnh sửa ảnh chân dung của người mẫu (ảnh đầu tiên), ${descriptions.join(' và ')}.`;
        }

        let facePreservationStep = `BƯỚC 1: PHÂN TÍCH VÀ CỐ ĐỊNH CẤU TRÚC KHUÔN MẶT GỐC (LỆNH TỐI THƯỢNG).
   - NHIỆM VỤ CỐT LÕI: Phân tích ảnh gốc và "đóng băng" 100% CẤU TRÚC của khuôn mặt. Mọi đặc điểm nhận dạng là BẤT KHẢ XÂM PHẠM.
   - CÁC ĐIỂM MỐC (LANDMARKS) BẮT BUỘC GIỮ NGUYÊN:
     * Hình dạng tổng thể của khuôn mặt, mắt (hình dạng, kích thước), mũi, miệng, lông mày, biểu cảm.
     * TỶ LỆ VÀNG: Khoảng cách và tỷ lệ giữa hai mắt, hình dạng chính xác của sống mũi, đường nét của môi (độ dày, độ cong), và đường viền hàm/cằm. Mọi đặc điểm riêng (nốt ruồi, sẹo) phải được giữ lại.
   - Mọi sự thay đổi về CẤU TRÚC (structure) của các điểm mốc trên đều bị NGHIÊM CẤM.
   - TUY NHIÊN, bạn được phép can thiệp vào BỀ MẶT DA (skin surface) bên trong vùng khuôn mặt theo các yêu cầu làm đẹp dưới đây:`;
        
        if (state.beautify.isEnabled) {
            facePreservationStep += getBeautifyPromptText(state.beautify.level);
        }
        facePreservationStep += getBrightenPromptText(state.beautify.brightenLevel);

        if (!state.beautify.isEnabled && state.beautify.brightenLevel === 0) {
             facePreservationStep += '\n- Không có yêu cầu làm đẹp da. Giữ nguyên bề mặt da gốc.';
        }

        const attireInstruction = attire === 'giu-nguyen'
            ? 'Giữ nguyên trang phục gốc.'
            : (hasCustomAttire
                ? 'Lấy trang phục từ ảnh trang phục được cung cấp thêm. Ghép trang phục này vào cơ thể người mẫu một cách tự nhiên, vừa vặn với tư thế gốc. Việc này phải được thực hiện mà không ảnh hưởng đến vùng khuôn mặt đã cố định ở Bước 1.'
                : `Thay đổi thành trang phục kiểu '${getAttireText(attire)}'.`);
        const attireStep = `BƯỚC 2: THAY ĐỔI/GHÉP TRANG PHỤC.\n   - ${attireInstruction}`;
        
        const hairstyleChangeStep = hairstyle === 'giu-nguyen'
            ? `BƯỚC 3: KIỂU TÓC.\n   - Giữ nguyên 100% kiểu tóc gốc.`
            : `BƯỚC 3: THAY ĐỔI KIỂU TÓC.
   - Yêu cầu: Thay đổi kiểu tóc thành '${getHairstyleText(hairstyle)}'.
   - LỆNH BẮT BUỘC: Kiểu tóc mới phải được tạo ra XUNG QUANH và PHÍA TRÊN vùng khuôn mặt đã được cố định ở Bước 1. Tuyệt đối không được để tóc mới xâm phạm, che lấp hoặc làm thay đổi bất kỳ đường nét nào của khuôn mặt, đặc biệt là trán, thái dương và đường chân tóc.`;

        const backgroundStep = `BƯỚC 4: THAY ĐỔI NỀN.\n   - ${getBackgroundInstruction()}`;
        
        const customPromptStep = state.customPrompt.trim()
            ? `\n\nBƯỚC 5: YÊU CẦU TÙY CHỈNH THÊM.\n   - ${state.customPrompt.trim()}`
            : '';

        let prompt = `MỤC TIÊU: ${imageUsageDescription} Giữ nguyên 100% khuôn mặt và chỉ thay đổi các yếu tố khác theo một quy trình nghiêm ngặt.
- Người trong ảnh là một ${gender === 'nu' ? 'người nữ' : 'người nam'}, đối tượng là ${getSubjectText(subject)}.

CÁC BƯỚC THỰC HIỆN BẮT BUỘC THEO THỨ TỰ:
${facePreservationStep}
${attireStep}
${hairstyleChangeStep}
${backgroundStep}${customPromptStep}

YÊU CẦU CUỐI CÙNG & KIỂM TRA CHÉO:
- KIỂM TRA: Sau khi hoàn thành, hãy đối chiếu lại cấu trúc khuôn mặt trên ảnh kết quả với ảnh gốc. Các "Điểm Mốc" và "Tỷ Lệ Vàng" được định nghĩa ở Bước 1 có trùng khớp 100% không? Nếu không, hãy làm lại.
- Giữ nguyên hoàn toàn tư thế của người trong ảnh gốc (góc đầu, hướng nhìn, vai).
- Kết quả cuối cùng phải là một bức ảnh duy nhất, trong đó người mẫu có khuôn mặt y hệt ảnh gốc, nhưng các yếu tố khác (trang phục, tóc, nền) đã được thay đổi theo yêu cầu.
- KÍCH THƯỚC: Ảnh đầu ra phải là ${state.image.width}x${state.image.height} pixels.
- Yêu cầu đặc biệt: Tạo một ảnh duy nhất, chụp chính diện, biểu cảm chuyên nghiệp, phù hợp cho hồ sơ xin việc hoặc ảnh thẻ.`;
        
        return prompt;
    }

    function setLoadingState(isLoading: boolean) {
        const btnText = generateBtn.querySelector('.btn-text');
        if (isLoading) {
            generateBtn.disabled = true;
            if (btnText) btnText.textContent = 'Đang tạo biến thể...';
            downloadBtn.disabled = true;
            downloadableImageUrl = null;
            imageGallery.innerHTML = `<div style="grid-column: 1 / -1;"><div class="loading-spinner"></div><p style="text-align: center; color: var(--text-muted-color); margin-top: 1rem;">AI đang sáng tạo, vui lòng chờ...</p></div>`;
        } else {
            generateBtn.disabled = false;
            if (btnText) btnText.textContent = 'Tạo ảnh';
        }
    }

    /**
     * Implements zoom (mouse wheel), pan (drag), and view-original (right-click) functionality for a gallery image.
     * @param {HTMLElement} wrapper The container element for the image.
     * @param {HTMLImageElement} img The image element to make interactive.
     * @param {string} generatedUrl The URL of the AI-generated image.
     * @param {string} originalUrl The URL of the user's original uploaded image.
     */
    function makeImageZoomable(wrapper: HTMLElement, img: HTMLImageElement, generatedUrl: string, originalUrl: string) {
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isPanning = false;
        let startX = 0;
        let startY = 0;

        img.style.transformOrigin = 'center center';

        function applyTransform() {
            const clampedScale = Math.max(1, scale);
            if (clampedScale <= 1) {
                panX = 0;
                panY = 0;
            }
            img.style.transform = `translate(${panX}px, ${panY}px) scale(${clampedScale})`;
        }

        // --- ZOOM ---
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            const oldScale = scale;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomFactor = 1.1;
            if (e.deltaY < 0) { // Zoom in
                scale *= zoomFactor;
            } else { // Zoom out
                scale /= zoomFactor;
            }
            
            scale = Math.max(1, Math.min(scale, 8)); // Clamp scale between 1x and 8x

            panX = mouseX - (mouseX - panX) * (scale / oldScale);
            panY = mouseY - (mouseY - panY) * (scale / oldScale);

            applyTransform();
        });

        // --- PAN (LEFT-CLICK DRAG) LOGIC ---
        const onMouseMove = (e: MouseEvent) => {
            if (!isPanning) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyTransform();
        };

        const onPanEnd = () => {
            isPanning = false;
            wrapper.style.cursor = 'grab';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onPanEnd);
        };
        
        // --- VIEW ORIGINAL (RIGHT-CLICK HOLD) LOGIC ---
        const showGenerated = () => {
            if (img.src !== generatedUrl) {
                img.src = generatedUrl;
            }
        };
        
        // --- COMBINED MOUSE EVENT HANDLERS ---
        wrapper.addEventListener('mousedown', (e) => {
            // Right-click to show original
            if (e.button === 2) {
                img.src = originalUrl;
                return;
            }

            // Left-click to pan when zoomed
            if (e.button === 0 && scale > 1) {
                e.preventDefault();
                isPanning = true;
                startX = e.clientX - panX;
                startY = e.clientY - panY;
                wrapper.style.cursor = 'grabbing';
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onPanEnd);
            }
        });

        // When any mouse button is released over the wrapper, revert to generated image
        wrapper.addEventListener('mouseup', showGenerated);

        // If mouse leaves the wrapper, revert to generated image (catches right-click hold and leave)
        wrapper.addEventListener('mouseleave', showGenerated);

        // --- CONTEXT MENU & RESET VIEW ---
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());

        wrapper.addEventListener('dblclick', () => {
            scale = 1;
            panX = 0;
            panY = 0;
            applyTransform();
        });
    }

    function displayResults(imageUrls: string[]) {
        imageGallery.innerHTML = '';
        imageGallery.classList.toggle('single-view', imageUrls.length === 1);
        let isFirstImage = true;
        const originalImageUrl = imagePreview.src;

        imageUrls.forEach(generatedImageUrl => {
            if (!generatedImageUrl) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'gallery-image-wrapper';
            
            const img = document.createElement('img');
            img.src = generatedImageUrl;
            img.alt = 'Ảnh được tạo bởi AI';

            wrapper.appendChild(img);
            imageGallery.appendChild(wrapper);

            // Make the image interactive with zoom, pan, and view original
            if (originalImageUrl && !originalImageUrl.endsWith('#')) {
                makeImageZoomable(wrapper, img, generatedImageUrl, originalImageUrl);
            }

            wrapper.addEventListener('click', () => {
                const currentSelectedWrapper = imageGallery.querySelector<HTMLDivElement>('.gallery-image-wrapper.selected');
                if (currentSelectedWrapper) {
                    currentSelectedWrapper.classList.remove('selected');
                }
                wrapper.classList.add('selected');
                downloadableImageUrl = generatedImageUrl; 
                downloadBtn.disabled = false;
                printLayoutContainer.classList.remove('hidden'); 
            });

            if (isFirstImage) {
                wrapper.classList.add('selected');
                downloadableImageUrl = generatedImageUrl;
                downloadBtn.disabled = false;
                isFirstImage = false;
                printLayoutContainer.classList.remove('hidden');
            }
        });

        if (imageGallery.childElementCount === 0) {
           displayError("Không thể tạo ảnh từ các tùy chọn đã chọn. Vui lòng thử lại.");
        }
    }
    
    function displayError(message: string) {
        imageGallery.innerHTML = '';
        const errorContainer = document.createElement('div');
        errorContainer.className = 'placeholder-gallery';
        const errorElement = document.createElement('p');
        errorElement.textContent = message;
        errorElement.style.color = '#ff6b6b';
        errorContainer.appendChild(errorElement)
        imageGallery.appendChild(errorContainer);
        downloadBtn.disabled = true;
        downloadableImageUrl = null;
    }

    // --- 7. PRINT LAYOUT HANDLING ---
    let sourceImage: HTMLImageElement | null = null;
    const DPI = 300;
    const PRINT_WIDTH_CM = 14.8;
    const PRINT_HEIGHT_CM = 10.5;

    const canvas = printCanvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error("Could not get 2D context from canvas");
    } else {
        // Setup canvas for a 15x10cm print at 300 DPI
        canvas.width = Math.round((PRINT_WIDTH_CM / 2.54) * DPI);
        canvas.height = Math.round((PRINT_HEIGHT_CM / 2.54) * DPI);

        function cmToPx(cm: number): number {
            return (cm / 2.54) * DPI;
        }

        function cropSourceImage(img: HTMLImageElement, targetRatio: number) {
            const sourceRatio = img.width / img.height;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
            if (sourceRatio < targetRatio) {
                sHeight = img.width / targetRatio;
                sy = (img.height - sHeight) / 2;
            } else {
                sWidth = img.height * targetRatio;
                sx = (img.width - sWidth) / 2;
            }
            return { sx, sy, sWidth, sHeight };
        }

        function processImage3x4(img: HTMLImageElement) {
            const PHOTO_WIDTH_CM = 2.7;
            const PHOTO_HEIGHT_CM = 3.8;
            const PHOTO_WIDTH_PX = Math.round(cmToPx(PHOTO_WIDTH_CM));
            const PHOTO_HEIGHT_PX = Math.round(cmToPx(PHOTO_HEIGHT_CM));
            
            const targetRatio = PHOTO_WIDTH_PX / PHOTO_HEIGHT_PX;
            const { sx, sy, sWidth, sHeight } = cropSourceImage(img, targetRatio);

            ctx.fillStyle = '#cccccc'; // Light grey background like demo
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const numCols = 4;
            const numRows = 2;
            const GAP_MM = 0.8; 
            const GAP_PX = Math.round(cmToPx(GAP_MM / 10));

            const gridWidth = (numCols * PHOTO_WIDTH_PX) + ((numCols - 1) * GAP_PX);
            const gridHeight = (numRows * PHOTO_HEIGHT_PX) + ((numRows - 1) * GAP_PX);

            const startX = (canvas.width - gridWidth) / 2;
            const startY = (canvas.height - gridHeight) / 2;

            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    const dx = startX + col * (PHOTO_WIDTH_PX + GAP_PX);
                    const dy = startY + row * (PHOTO_HEIGHT_PX + GAP_PX);
                    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);
                }
            }
        }

        function processImage4x6(img: HTMLImageElement) {
            const PHOTO_WIDTH_CM = 3.7;
            const PHOTO_HEIGHT_CM = 5.4;
            const PHOTO_WIDTH_PX = Math.round(cmToPx(PHOTO_WIDTH_CM));
            const PHOTO_HEIGHT_PX = Math.round(cmToPx(PHOTO_HEIGHT_CM));

            const targetRatio = PHOTO_WIDTH_PX / PHOTO_HEIGHT_PX;
            const { sx, sy, sWidth, sHeight } = cropSourceImage(img, targetRatio);

            ctx.fillStyle = '#cccccc'; // Light grey background like demo
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const GAP_MM = 0.8;
            const GAP_PX = Math.round(cmToPx(GAP_MM / 10));

            const topRowWidth = (3 * PHOTO_WIDTH_PX) + (2 * GAP_PX);
            const bottomRowWidth = (2 * PHOTO_HEIGHT_PX) + (1 * GAP_PX);
            const totalHeight = PHOTO_HEIGHT_PX + GAP_PX + PHOTO_WIDTH_PX;

            const startY = (canvas.height - totalHeight) / 2;

            // Draw 3 images in the top row
            const startXTop = (canvas.width - topRowWidth) / 2;
            for (let col = 0; col < 3; col++) {
                const dx = startXTop + col * (PHOTO_WIDTH_PX + GAP_PX);
                ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, startY, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);
            }

            // Draw 2 rotated images in the bottom row
            const startXBottom = (canvas.width - bottomRowWidth) / 2;
            const dyBottom = startY + PHOTO_HEIGHT_PX + GAP_PX;
            for (let col = 0; col < 2; col++) {
                const dx = startXBottom + col * (PHOTO_HEIGHT_PX + GAP_PX);
                ctx.save();
                ctx.translate(dx + PHOTO_HEIGHT_PX / 2, dyBottom + PHOTO_WIDTH_PX / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.drawImage(
                    img, 
                    sx, sy, sWidth, sHeight, 
                    -PHOTO_WIDTH_PX / 2, -PHOTO_HEIGHT_PX / 2, 
                    PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX
                );
                ctx.restore();
            }
        }
        
        function processImageCombo(img: HTMLImageElement) {
            // 4x6 photo dimensions (top row)
            const PHOTO_4x6_WIDTH_CM = 3.7;
            const PHOTO_4x6_HEIGHT_CM = 5.4;
            const PHOTO_4x6_WIDTH_PX = Math.round(cmToPx(PHOTO_4x6_WIDTH_CM));
            const PHOTO_4x6_HEIGHT_PX = Math.round(cmToPx(PHOTO_4x6_HEIGHT_CM));

            // 3x4 photo dimensions (bottom row)
            const PHOTO_3x4_WIDTH_CM = 2.7;
            const PHOTO_3x4_HEIGHT_CM = 3.8;
            const PHOTO_3x4_WIDTH_PX = Math.round(cmToPx(PHOTO_3x4_WIDTH_CM));
            const PHOTO_3x4_HEIGHT_PX = Math.round(cmToPx(PHOTO_3x4_HEIGHT_CM));

            // Crop the source image for each aspect ratio
            const targetRatio4x6 = PHOTO_4x6_WIDTH_PX / PHOTO_4x6_HEIGHT_PX;
            const crop4x6 = cropSourceImage(img, targetRatio4x6);
            const targetRatio3x4 = PHOTO_3x4_WIDTH_PX / PHOTO_3x4_HEIGHT_PX;
            const crop3x4 = cropSourceImage(img, targetRatio3x4);

            ctx.fillStyle = '#cccccc'; // Background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const GAP_MM = 0.8;
            const GAP_PX = Math.round(cmToPx(GAP_MM / 10));

            // Layout calculations
            const topRowWidth = (3 * PHOTO_4x6_WIDTH_PX) + (2 * GAP_PX);
            const bottomRowWidth = (4 * PHOTO_3x4_WIDTH_PX) + (3 * GAP_PX);
            const totalHeight = PHOTO_4x6_HEIGHT_PX + GAP_PX + PHOTO_3x4_HEIGHT_PX;

            const startYTotal = (canvas.height - totalHeight) / 2;
            
            // Draw top row (3 4x6 photos)
            const startXTop = (canvas.width - topRowWidth) / 2;
            const startYTop = startYTotal;
            for (let col = 0; col < 3; col++) {
                const dx = startXTop + col * (PHOTO_4x6_WIDTH_PX + GAP_PX);
                ctx.drawImage(img, crop4x6.sx, crop4x6.sy, crop4x6.sWidth, crop4x6.sHeight, dx, startYTop, PHOTO_4x6_WIDTH_PX, PHOTO_4x6_HEIGHT_PX);
            }

            // Draw bottom row (4 3x4 photos)
            const startXBottom = (canvas.width - bottomRowWidth) / 2;
            const startYBottom = startYTop + PHOTO_4x6_HEIGHT_PX + GAP_PX;
            for (let col = 0; col < 4; col++) {
                const dx = startXBottom + col * (PHOTO_3x4_WIDTH_PX + GAP_PX);
                ctx.drawImage(img, crop3x4.sx, crop3x4.sy, crop3x4.sWidth, crop3x4.sHeight, dx, startYBottom, PHOTO_3x4_WIDTH_PX, PHOTO_3x4_HEIGHT_PX);
            }
        }

        function handleLayoutButtonClick(processor: (img: HTMLImageElement) => void) {
             if (!downloadableImageUrl) {
                showNotification('Vui lòng chọn ảnh gốc trước.', 'error');
                return;
            }

            sourceImage = new Image();
            sourceImage.crossOrigin = "anonymous"; 
            
            sourceImage.onload = () => {
                if(sourceImage) {
                    processor(sourceImage);
                    canvas.classList.remove('hidden');
                    downloadLayoutBtn.classList.remove('hidden');
                    downloadLayoutBtn.disabled = false;
                    printLayoutBtn.classList.remove('hidden');
                    printLayoutBtn.disabled = false;
                }
            };
            
            sourceImage.onerror = () => {
                showNotification('Không thể tải ảnh để tạo layout. Vui lòng thử lại.', 'error');
            };

            sourceImage.src = downloadableImageUrl;
        }

        layout3x4Btn.addEventListener('click', () => handleLayoutButtonClick(processImage3x4));
        layout4x6Btn.addEventListener('click', () => handleLayoutButtonClick(processImage4x6));
        layoutComboBtn.addEventListener('click', () => handleLayoutButtonClick(processImageCombo));

        downloadLayoutBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = 'anh-in-ai-tien-adobe.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        printLayoutBtn.addEventListener('click', () => {
            if (!printCanvas || printCanvas.classList.contains('hidden')) {
                showNotification('Vui lòng tạo một layout in trước.', 'error');
                return;
            }
    
            try {
                const imageDataUrl = printCanvas.toDataURL('image/jpeg', 0.95);
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);

                const iframeDoc = iframe.contentWindow?.document;
                if (iframeDoc) {
                    iframeDoc.write(`
                        <html>
                          <head>
                            <title>In ảnh - Kenle</title>
                            <style>
                              @page {
                                size: ${PRINT_WIDTH_CM}cm ${PRINT_HEIGHT_CM}cm;
                                margin: 0;
                              }
                              body {
                                margin: 0;
                                padding: 0;
                              }
                              img {
                                width: 100%;
                                height: 100%;
                                display: block;
                              }
                            </style>
                          </head>
                          <body>
                            <img src="${imageDataUrl}" />
                          </body>
                        </html>
                    `);
                    iframeDoc.close();
                    setTimeout(() => {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                        setTimeout(() => {
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                        }, 2000);
                    }, 300);
                } else {
                    showNotification('Không thể khởi tạo môi trường in.', 'error');
                }
            } catch (e) {
                console.error('Lỗi khi chuẩn bị in:', e);
                showNotification('Đã xảy ra lỗi khi chuẩn bị file để in.', 'error');
            }
        });
    }
});
