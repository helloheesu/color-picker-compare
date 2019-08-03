export const init = (
  selector: string,
  callback: (file: File | void) => void
) => {
  const dropzoneList: NodeList = document.querySelectorAll(selector);
  dropzoneList.forEach(dropzone => {
    dropzone.addEventListener("dragenter", handleEvent);
    dropzone.addEventListener("dragleave", handleEvent);
    dropzone.addEventListener("dragover", handleEvent);
    dropzone.addEventListener("drop", handleEvent);
  });

  function handleEvent(e: DragEvent) {
    if (e.type === "dragover") {
      e.preventDefault();
    }
    if (e.type === "drop") {
      e.preventDefault();

      const file = e.dataTransfer.files[0];

      if (!file) {
        return;
      }

      callback(file);
    }
  }
};

export const getDataUrl = async (file: File) => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(file);
    fr.readAsDataURL(file);
  });
};

export const getImage = async (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(src);
    img.src = src;
  });
};
