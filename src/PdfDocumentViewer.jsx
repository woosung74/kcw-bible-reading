import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function PdfPage({ document, pageNumber }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask;

    const render = async () => {
      const page = await document.getPage(pageNumber);
      if (cancelled || !wrapperRef.current || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const width = Math.max(280, wrapperRef.current.clientWidth);
      const scale = width / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d', { alpha: false });
      renderTask = page.render({ canvasContext: context, viewport, transform: pixelRatio === 1 ? null : [pixelRatio, 0, 0, pixelRatio, 0, 0] });
      await renderTask.promise;
    };

    render().catch(error => {
      if (error?.name !== 'RenderingCancelledException') console.error('PDF page render failed', error);
    });
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber]);

  return <figure className="summary-pdf-page" ref={wrapperRef} aria-label={`${pageNumber}쪽`}>
    <canvas ref={canvasRef} />
    <figcaption>{pageNumber}쪽</figcaption>
  </figure>;
}

export default function PdfDocumentViewer({ url, title }) {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const task = pdfjs.getDocument({ url });
    task.promise.then(pdf => {
      if (active) setDocument(pdf);
      else pdf.destroy();
    }).catch(error => {
      if (active) {
        console.error('PDF document load failed', error);
        setError(true);
      }
    });
    return () => {
      active = false;
      task.destroy();
    };
  }, [url]);

  if (error) return <div className="summary-pdf-message" role="alert">PDF를 불러오지 못했습니다. 위의 다운로드 버튼을 이용해 주세요.</div>;
  if (!document) return <div className="summary-pdf-message" role="status">PDF 전체 문서를 불러오는 중입니다…</div>;

  return <div className="summary-viewer-pages" aria-label={`${title} 전체 ${document.numPages}쪽`}>
    <p className="summary-page-count">전체 {document.numPages}쪽 · 아래로 넘기며 읽어 보세요</p>
    {Array.from({ length: document.numPages }, (_, index) => <PdfPage key={index + 1} document={document} pageNumber={index + 1} />)}
  </div>;
}
