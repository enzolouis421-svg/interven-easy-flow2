import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFData {
  title: string;
  content: string;
  filename: string;
}

export const generatePDFFromHTML = async (htmlContent: string, filename: string): Promise<void> => {
  try {
    // Créer un élément temporaire pour contenir le HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.fontSize = '12px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';
    
    document.body.appendChild(tempDiv);

    // Attendre que toutes les images soient chargées
    const images = tempDiv.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img, index) => {
      return new Promise<void>((resolve) => {
        // Si l'image est déjà en base64, elle devrait se charger immédiatement
        const isBase64 = img.src.startsWith('data:');
        
        if (isBase64) {
          // Pour les images base64, vérifier qu'elles sont chargées
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
            return;
          }
          
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('Erreur chargement image base64:', index + 1);
            resolve(); // Continuer même si l'image échoue
          };
          
          // Timeout plus court pour base64 (devrait être instantané)
          setTimeout(() => {
            if (img.complete) {
              resolve();
            } else {
              console.warn('Timeout image base64:', index + 1);
              resolve();
            }
          }, 2000);
        } else {
          // Pour les URLs externes, utiliser retry
          const loadImage = (retryCount = 0) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
              return;
            }

            const maxRetries = 2;
            const timeout = 8000;

            const timeoutId = setTimeout(() => {
              if (retryCount < maxRetries) {
                console.warn(`Timeout image ${index + 1}, retry ${retryCount + 1}/${maxRetries}`);
                img.src = img.src + (img.src.includes('?') ? '&' : '?') + `t=${Date.now()}`;
                loadImage(retryCount + 1);
              } else {
                console.warn('Timeout final image:', index + 1);
                resolve();
              }
            }, timeout);

            img.onload = () => {
              clearTimeout(timeoutId);
              resolve();
            };

            img.onerror = () => {
              clearTimeout(timeoutId);
              if (retryCount < maxRetries) {
                setTimeout(() => {
                  img.src = img.src + (img.src.includes('?') ? '&' : '?') + `t=${Date.now()}`;
                  loadImage(retryCount + 1);
                }, 1000);
              } else {
                console.warn('Erreur finale image:', index + 1);
                resolve();
              }
            };

            if (!img.complete) {
              img.loading = 'eager';
              img.style.display = 'block';
            }
          };

          loadImage();
        }
      });
    });

    await Promise.all(imagePromises);

    // Attendre un peu pour s'assurer que tout est rendu
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convertir en canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true, // Permettre le taint pour les images externes
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: tempDiv.scrollHeight,
      logging: false,
      imageTimeout: 30000, // 30 secondes
      removeContainer: false,
      foreignObjectRendering: false
    });

    // Nettoyer l'élément temporaire
    document.body.removeChild(tempDiv);

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Télécharger le PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
};

export const generatePDFFromElement = async (elementId: string, filename: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Élément non trouvé');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
};

