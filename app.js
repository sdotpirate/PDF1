document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('createPdfButton').addEventListener('click', () => {
        const input = document.getElementById('fileInput');
        const notes = tinymce.get('editor').getContent();
        const notesPosition = document.getElementById('notesPosition').value;
        const customFileName = document.getElementById('fileNameInput').value.trim();

        if (input.files.length > 0) {
            createPdf(input.files, notes, notesPosition, customFileName);
        } else {
            alert('Please select images to create a PDF.');
        }
    });

    async function createPdf(files, notes, notesPosition, customFileName) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const promises = Array.from(files).map(file => resizeImage(file, 1024, 1024));

        const images = await Promise.all(promises);

        if (notes && notes.trim() !== '') {
            if (notesPosition === 'first') {
                addNotesPage(pdf, notes);
                images.forEach((imgData, index) => {
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
                });
            } else {
                images.forEach((imgData, index) => {
                    if (index > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
                });
                pdf.addPage();
                addNotesPage(pdf, notes);
            }
        } else {
            images.forEach((imgData, index) => {
                if (index > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
            });
        }

        const fileName = customFileName || generateDefaultFileName();
        pdf.save(fileName);
    }

    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    }

    function addNotesPage(pdf, notes) {
        const canvas = document.createElement('canvas');
        canvas.width = 595; // A4 size in pt (210mm)
        canvas.height = 842; // A4 size in pt (297mm)
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = notes;
        const textContent = tempDiv.innerText || tempDiv.textContent;

        const lines = textContent.split('\n');
        let y = 30;
        lines.forEach(line => {
            ctx.fillText(line.trim(), 20, y);
            y += 20;
        });

        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 210, 297);
    }

    function generateDefaultFileName() {
        const appName = "appname";
        const date = new Date().toISOString().slice(0, 10);
        const randomNumber = Math.floor(Math.random() * 1000);
        return `${appName}_${date}_${randomNumber}.pdf`;
    }
});
