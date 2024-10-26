const imageToCrop = document.getElementById("imageToCrop");
const cropperWrapper = document.querySelector(".cropper-wrapper");
const cropperfullscreenOverlay = document.querySelector("div#cropperfullscreenOverlay");
let cropper;

// إضافة مستمع أحداث لتحميل الصور الجديدة وتحديث الكروبر تلقائيًا
document.getElementById("imageUpload").addEventListener("change", (event) => {
    const files = event.target.files;
    if (files.length === 0) {
        alert("Please upload at least one image file.");
        return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        imageToCrop.src = event.target.result;
        cropperWrapper.style.display = "flex";
        cropperfullscreenOverlay.style.display = "flex";
        cropper = new Cropper(imageToCrop, {
            aspectRatio: null,
            viewMode: 2,
            cropBoxResizable: true,
            background: true,
            fit: true, // استخدام fit بدلاً من fill
            ready() {
                const cropperContainer = cropper.cropBox;
                cropperContainer.style.backgroundColor = "#0a0a0a";
                
                // إضافة خلفية سوداء للمناطق الجانبية
                const canvas = cropper.getCanvasData();
                const container = cropper.getContainerData();
                
                if (canvas.width < container.width) {
                    const leftSpace = document.createElement('div');
                    const rightSpace = document.createElement('div');
                    
                    const commonStyles = {
                        position: 'absolute',
                        top: '0',
                        height: '100%',
                        backgroundColor: '#0a0a0a',
                        zIndex: '-1'
                    };
                    
                    Object.assign(leftSpace.style, commonStyles, {
                        left: '0',
                        width: `${(container.width - canvas.width) / 2}px`
                    });
                    
                    Object.assign(rightSpace.style, commonStyles, {
                        right: '0',
                        width: `${(container.width - canvas.width) / 2}px`
                    });
                    
                    cropperContainer.appendChild(leftSpace);
                    cropperContainer.appendChild(rightSpace);
                }
            },
        });
        document.getElementById("cropImage").style.display = "block";
    };
    reader.readAsDataURL(file);
});

// إضافة مستمع أحداث للنقر على الزر لقص الصورة
document.getElementById("cropImage").addEventListener("click", () => {
    const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        backgroundColor: '#0a0a0a' // استخدام backgroundColor بدلاً من fillColor
    });
    
    const croppedImage = new Image();
    croppedImage.onload = function() {
        processImage(croppedImage);
        saveToLocalStorage(croppedCanvas.toDataURL());
    };
    croppedImage.src = croppedCanvas.toDataURL();
    cropperWrapper.style.display = "none";
    cropperfullscreenOverlay.style.display = "none";
    cropper.destroy();
    document.getElementById("cropImage").style.display = "none";
});

function saveToLocalStorage(croppedImageDataUrl) {
    localStorage.setItem("croppedImage", croppedImageDataUrl);
    const savedCroppedImage = localStorage.getItem("croppedImage");

    if (savedCroppedImage) {
        croppedImage = new Image();
        croppedImage.onload = async function() {
            await processImage(croppedImage);
        };
        croppedImage.src = savedCroppedImage;
    }
}