// Canvas Setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1080;
canvas.height = 1080;

// Global Variables
let currentImage = null;
let backgroundImg = new Image();
let watermarkImg = new Image();
let showWatermark = false;
let watermarkOpacity = 1;
let selectedWatermark = 'Asset4.png';
let textChangeTimer;

// Initialize Images with Error Handling
backgroundImg.src = 'background.png';
backgroundImg.onerror = function(e) {
    console.error('Error loading background image:', e);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};
backgroundImg.onload = safeUpdateCanvas;

// Watermark Loading Function
function loadWatermark(src) {
    watermarkImg = new Image();
    watermarkImg.onload = safeUpdateCanvas;
    watermarkImg.onerror = (e) => console.error('Error loading watermark:', e);
    watermarkImg.src = src;
}

// Load Initial Watermark
loadWatermark(selectedWatermark);

// Text Processing Functions
function handleTextChange() {
    clearTimeout(textChangeTimer);
    textChangeTimer = setTimeout(() => {
        if (currentImage) processImage(currentImage);
    }, 300);
}

// Update image loading to handle CORS
function processImage(image) {
    try {
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous"; // Add CORS support
        tempImg.onload = function() {
            currentImage = tempImg;
            safeUpdateCanvas();
            document.getElementById('downloadImage').disabled = false;
        };
        tempImg.onerror = function(e) {
            console.error('Error loading temporary image:', e);
        };
        tempImg.src = image.src;
    } catch (error) {
        console.error('Error processing image:', error);
    }
}
document.getElementById('imageUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                processImage(img); // إذا كان لديك وظيفة لعرض الصورة
                extractTextFromImage(img); // استخراج النص مباشرة بعد تحميل الصورة
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// دالة استخراج النص
function extractTextFromImage(img) {
    // إنشاء Canvas لتحديد المنطقة
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // تعيين أبعاد Canvas
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;

    // رسم الصورة على Canvas
    tempCtx.drawImage(img, 0, 0);

    // تحديد المنطقة المطلوبة (750 - 1000)
    const imageData = tempCtx.getImageData(0, 750, img.width, 250); // ارتفاع 250 بكسل من 750 إلى 1000

    // إنشاء Canvas جديد لاستخراج النص
    const extractionCanvas = document.createElement('canvas');
    extractionCanvas.width = img.width;
    extractionCanvas.height = 250; // ارتفاع المنطقة المطلوبة
    const extractionCtx = extractionCanvas.getContext('2d');

    // رسم المنطقة المحددة على Canvas جديد
    extractionCtx.putImageData(imageData, 0, 0);

    // استخدام Tesseract لاستخراج النص من المنطقة المحددة
    Tesseract.recognize(
        extractionCanvas.toDataURL(), // تحويل Canvas إلى Data URL
        'ara', // تحديد اللغة العربية
        {
            logger: info => console.log(info) // سجل التقدم
        }
    ).then(({ data: { text } }) => {
        // عرض النص المستخرج في مربع النص
        document.getElementById('textBox').value = text;
        console.log(text); // يمكنك استخدام النص كما تريد
    }).catch(error => {
        console.error('Error extracting text:', error);
        alert('حدث خطأ أثناء استخراج النص. يرجى المحاولة مرة أخرى.');
    });
}


function drawText() {
    const text = document.getElementById('textBox').value;
    if (!text) return;

    const rectX = 50;
    const rectY = 125;
    const rectWidth = 980;
    const rectHeight = 265;
    const lineHeight = 50; // ارتفاع السطر
    const padding_x = 10; // الحشو

    ctx.save();
    ctx.font = "48px 'Tajawal', sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";

    let words = text.split(' ');
    let line = '';
    let lines = [];

    // تقسيم النص إلى أسطر
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;

        if (testWidth > rectWidth - (padding_x * 2) && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    // حساب موضع بدء الرسم عموديًا في المنتصف
    const startY = rectY + (rectHeight - (lines.length * lineHeight)) / 2 + lineHeight / 2;

    // رسم الأسطر مع تحديد المحاذاة
    for (let i = 0; i < lines.length; i++) {
        let lineText = lines[i];
        let isArabic = /[\u0600-\u06FF]/.test(lineText);

        if (isArabic) {
            ctx.direction = 'rtl';
            ctx.textAlign = 'right';
            ctx.fillText(lineText, rectX + rectWidth - padding_x, startY + (i * lineHeight)); // محاذاة لليمين
        } else {
            ctx.direction = 'ltr';
            ctx.textAlign = (i === lines.length - 1) ? 'left' : 'justify'; // المحاذاة للسطر الأخير
            if (i === lines.length - 1) {
                const totalTextWidth = ctx.measureText(lineText).width;
                const spaceWidth = ctx.measureText(' ').width;
                const totalSpacing = rectWidth - totalTextWidth - (padding_x * 2);
                const spaceBetweenWords = lineText.split(' ').length - 1 > 0 ?
                    totalSpacing / (lineText.split(' ').length - 1) : 0;

                let currentX = rectX + padding_x; // الحشو
                lineText.split(' ').forEach((word, index) => {
                    ctx.fillText(word, currentX, startY + (i * lineHeight));
                    currentX += ctx.measureText(word).width + spaceBetweenWords + spaceWidth;
                });
            } else {
                ctx.fillText(lineText, rectX + padding_x, startY + (i * lineHeight)); // محاذاة لليسار
            }
        }
    }

    ctx.restore();
}


function drawWatermark() {
    if (!showWatermark || !watermarkImg.complete || !watermarkImg.naturalWidth) return;

    try {
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;

        const watermarkWidth = 130;
        const watermarkHeight = 63;
        const watermarkX = (canvas.width - watermarkWidth) / 2;
        const watermarkY = canvas.height - 150;

        ctx.drawImage(watermarkImg, watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        ctx.restore();
    } catch (error) {
        console.error('Error drawing watermark:', error);
    }
}

// Canvas Update Functions
function safeUpdateCanvas() {
    try {
        updateCanvas();
        saveToLocalStorage();
    } catch (error) {
        console.error('Error updating canvas:', error);
    }
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background
    if (backgroundImg.complete && backgroundImg.naturalWidth) {
        try {
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        } catch (error) {
            console.error('Error drawing background:', error);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Draw Current Image
    if (currentImage && currentImage.complete && currentImage.naturalWidth) {
        try {
            const h = 607.5 ;
            const w = (h * currentImage.width) / currentImage.height;
            const x = (canvas.width - w) / 2;
            const y = canvas.height - 607.5 - 50;

            const dominantColor = getDominantColor(currentImage);
            
            // Draw background extensions
            ctx.fillStyle = dominantColor;
            ctx.fillRect(0, y, (canvas.width - w) / 2, h);
            ctx.fillRect(canvas.width - (canvas.width - w) / 2, y, (canvas.width - w) / 2, h);

            // Draw image with high quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(currentImage, x, y, w, h);
        } catch (error) {
            console.error('Error drawing current image:', error);
        }
    }

    drawText();
    drawWatermark();
}

// Utility Functions
function getDominantColor(image) {
    try {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        tempCtx.drawImage(image, 0, 0, image.width, image.height);
        
        const pixelData = tempCtx.getImageData(10, image.height / 2, 1, 1).data;
        return `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
    } catch (error) {
        console.error('Error getting dominant color:', error);
        return '#000000';
    }
}

// For the second issue (Canvas security error), modify these functions:
function saveToLocalStorage() {
    try {
        const settings = {
            showWatermark,
            watermarkOpacity,
            selectedWatermark,
            text: document.getElementById('textBox')?.value || ''
        };
        localStorage.setItem('imageEditorSettings', JSON.stringify(settings));
        // Remove canvas state saving as it's causing security issues
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function restoreSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('imageEditorSettings'));
        if (settings) {
            showWatermark = settings.showWatermark;
            watermarkOpacity = settings.watermarkOpacity;
            selectedWatermark = settings.selectedWatermark;
            document.getElementById('textBox').value = settings.text;
            if (document.getElementById('toggleWatermark')) {
                document.getElementById('toggleWatermark').checked = showWatermark;
                document.getElementById('opacitySlider').value = watermarkOpacity;
                document.getElementById('opacitySlider').disabled = !showWatermark;
            }
            loadWatermark(selectedWatermark);
        }
    } catch (error) {
        console.error('Error restoring settings:', error);
    }
}

// Download Function
function downloadCanvas() {
    try {
        // تأكد من أن الكانفس غير فارغ
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            alert('لا يوجد محتوى لتحميله.');
            return;
        }

        const link = document.createElement('a');
        link.download = `edited-image-${new Date().getTime()}.png`;

        // استخدم toDataURL مع إعدادات الصورة
        link.href = canvas.toDataURL('image/png', 1.0);
        
        // تحقق من أن البيانات متاحة
        if (link.href) {
            link.click();
        } else {
            alert('فشل تحميل الصورة. يرجى المحاولة مرة أخرى.');
        }
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.');
    }
}


// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        textBox: document.getElementById('textBox'),
        downloadImage: document.getElementById('downloadImage'),
        imageUpload: document.getElementById('imageUpload'),
        toggleWatermark: document.getElementById('toggleWatermark'),
        opacitySlider: document.getElementById('opacitySlider'),
        watermarkSelect: document.getElementById('watermarkSelect'),
        extractTextButton: document.getElementById('extractTextButton')
    };

    // Initialize event listeners only if elements exist
    if (elements.textBox) {
        elements.textBox.addEventListener('input', safeUpdateCanvas);
    }
    
    if (elements.downloadImage) {
        elements.downloadImage.addEventListener('click', downloadCanvas);
    }
    
    if (elements.imageUpload) {
        elements.imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => processImage(img);
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (elements.toggleWatermark) {
        elements.toggleWatermark.addEventListener('change', (event) => {
            showWatermark = event.target.checked;
            if (elements.opacitySlider) {
                elements.opacitySlider.disabled = !event.target.checked;
                watermarkOpacity = event.target.checked ? elements.opacitySlider.value : 0;
            }
            safeUpdateCanvas();
        });
    }
    
    if (elements.opacitySlider) {
        elements.opacitySlider.addEventListener('input', (event) => {
            watermarkOpacity = parseFloat(event.target.value);
            safeUpdateCanvas();
        });
    }
    
    if (elements.watermarkSelect) {
        elements.watermarkSelect.addEventListener('change', (event) => {
            selectedWatermark = event.target.value;
            loadWatermark(selectedWatermark);
        });
    }

    if (elements.extractTextButton) {
        elements.extractTextButton.addEventListener('click', extractTextFromImage);
    }

    // Restore settings after initializing event listeners
    restoreSettings();
});






























// Global Variables for second canvas
let backgroundImg2 = new Image();
backgroundImg2.src = 'reels_background.png'; // تأكد من أن الصورة في نفس مسار الكود

backgroundImg2.onload = () => safeUpdateCanvas2();
backgroundImg2.onerror = () => {
    console.error('Error loading background image for canvas 2: Check the image path.');
};

// Function to safely update canvas 2
function safeUpdateCanvas2() {
    try {
        updateCanvas2();
    } catch (error) {
        console.error('Error updating canvas 2:', error);
    }
}

// Function to update canvas 2 and draw cropped canvas 1 content
function updateCanvas2() {
    const canvas1 = document.getElementById('canvas'); // الكانفاس الأول
    const canvas2 = document.getElementById('canvas2');
    const ctx2 = canvas2.getContext('2d');

    // Set the dimensions of canvas 2
    canvas2.width = 1080; // العرض
    canvas2.height = 1920; // الارتفاع

    // Clear canvas 2
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    // Draw background image on canvas 2
    if (backgroundImg2.complete && backgroundImg2.naturalWidth) {
        ctx2.drawImage(backgroundImg2, 0, 0, canvas2.width, canvas2.height);
    } else {
        console.error('Background image not loaded properly.');
    }

    // Check if canvas 1 exists and is ready
    if (canvas1) {
        const cropTop = 115; // Crop 115 pixels from the top
        const cropBottom = 50; // Crop 50 pixels from the bottom
        const cropHeight = canvas1.height - cropTop - cropBottom; // Cropped height
        const cropWidth = canvas1.width; // Width

        // Center canvas 1 content on canvas 2
        const x = (canvas2.width - cropWidth) / 2;
        const y = (canvas2.height - cropHeight) / 2;

        // Draw cropped canvas 1 content on canvas 2
        ctx2.drawImage(canvas1, 0, cropTop, cropWidth, cropHeight, x, y, cropWidth, cropHeight);
    }
}

// Add event listeners to update canvas 2 when any input or button changes
const inputs = document.querySelectorAll('input, select, textarea, button');
inputs.forEach(input => {
    input.addEventListener('change', safeUpdateCanvas2); // Listen for change events
    input.addEventListener('input', safeUpdateCanvas2); // Listen for input events (for text inputs)
    input.addEventListener('click', safeUpdateCanvas2); // Listen for click events (for buttons)
});
