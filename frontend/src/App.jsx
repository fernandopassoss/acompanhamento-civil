import React, { useState } from 'react';
import { Camera, FileText, Loader2, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './index.css';
import logo from './assets/krm.png';

const CONTRACTORS = [
  "Leandro",
  "Manoel"
];

function App() {
  const [obras, setObras] = useState([{
    id: Date.now(),
    workName: '',
    contractor: CONTRACTORS[0],
    date: new Date().toISOString().split('T')[0],
    description: '',
    photos: [null, null, null]
  }]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (index, e) => {
    const { name, value } = e;
    const newObras = [...obras];
    newObras[index][name] = value;
    setObras(newObras);
  };

  const handlePhotoUpload = (obraIndex, photoIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newObras = [...obras];
        newObras[obraIndex].photos[photoIndex] = reader.result;
        setObras(newObras);
      };
      reader.readAsDataURL(file);
    }
  };

  const addObra = () => {
    setObras([...obras, {
      id: Date.now(),
      workName: '',
      contractor: CONTRACTORS[0],
      date: new Date().toISOString().split('T')[0],
      description: '',
      photos: [null, null, null]
    }]);
  };

  const removeObra = (index) => {
    setObras(obras.filter((_, i) => i !== index));
  };

  const generatePDF = async (e) => {
    e.preventDefault();

    // Validação
    for (let i = 0; i < obras.length; i++) {
      if (obras[i].photos.some(p => p === null)) {
        alert(`Por favor, envie as 3 fotos para a Obra ${i + 1} antes de gerar o relatório.`);
        return;
      }
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 0;

      for (let i = 0; i < obras.length; i++) {
        const element = document.getElementById(`report-obra-${i}`);

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight && currentY > 0) {
          pdf.addPage();
          currentY = 0;
        }

        pdf.addImage(imgData, 'PNG', 0, currentY, pdfWidth, imgHeight);
        currentY += imgHeight;
      }

      const fileNameData = obras.length === 1
        ? `${obras[0].workName.replace(/\s+/g, '_')}`
        : 'Lote';

      pdf.save(`relatorio_${fileNameData}_${obras[0].date}.pdf`);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF em lote. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="app-container">
        <header className="header">
          <img src={logo} alt="KRM Logo" className='logo' />
          <h1>Acompanhamento de Obras - KRM</h1>
          <p>Registro fotográfico e informativo em lote</p>
        </header>

        <form onSubmit={generatePDF}>
          {obras.map((obra, index) => (
            <div key={obra.id} className="obra-card">
              <div className="obra-header">
                <h2>Obra {index + 1}</h2>
                {obras.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeObra(index)}>
                    <Trash2 size={18} /> Remover Obra
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Dono da Obra ou Lote</label>
                <input
                  type="text"
                  name="workName"
                  className="form-control"
                  placeholder="Ex: João da Silva"
                  value={obra.workName}
                  onChange={(e) => handleInputChange(index, e.target)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Empreiteiro Responsável</label>
                <select
                  name="contractor"
                  className="form-control"
                  value={obra.contractor}
                  onChange={(e) => handleInputChange(index, e.target)}
                >
                  {CONTRACTORS.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data do Acompanhamento</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={obra.date}
                  onChange={(e) => handleInputChange(index, e.target)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição do Andamento</label>
                <textarea
                  name="description"
                  className="form-control"
                  placeholder="Descreva o que foi realizado desde a última visita..."
                  value={obra.description}
                  onChange={(e) => handleInputChange(index, e.target)}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Registro Fotográfico (3 fotos obrigatórias)</label>
                <div className="photo-grid">
                  {[0, 1, 2].map((photoIdx) => (
                    <div key={photoIdx} className="photo-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(index, photoIdx, e)}
                      />
                      {obra.photos[photoIdx] ? (
                        <img src={obra.photos[photoIdx]} alt={`Foto ${photoIdx + 1}`} className="photo-preview" />
                      ) : (
                        <>
                          <Camera className="icon" size={32} />
                          <span>Adicionar Foto {photoIdx + 1}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="action-buttons">
            <button type="button" className="btn-add" onClick={addObra}>
              <PlusCircle size={20} /> Adicionar Outra Obra
            </button>

            <button type="submit" className={`btn-submit ${isGenerating ? 'loading' : ''}`} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="spinner" size={24} /> Gerando PDF...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={24} /> Concluído!
                </>
              ) : (
                <>
                  <FileText size={24} /> Gerar Relatório PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Hidden elements to capture for PDF */}
      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px', zIndex: -1 }}>
        {obras.map((obra, idx) => (
          <div
            key={`report-${obra.id}`}
            id={`report-obra-${idx}`}
            style={{
              width: '800px',
              padding: '40px',
              background: 'white',
              color: 'black',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #F05A28', paddingBottom: '15px', marginBottom: '20px' }}>
              <img src={logo} alt="KRM Logo" style={{ height: '60px', objectFit: 'contain' }} />
              <h1 style={{ color: '#1f2937', margin: 0, fontSize: '24px', textAlign: 'right', fontWeight: 'bold' }}>
                Relatório de Acompanhamento<br />de Obras
              </h1>
            </div>

            <div style={{ margin: '30px 0', fontSize: '18px', lineHeight: '1.6' }}>
              <p><strong>Dono da Obra:</strong> {obra.workName}</p>
              <p><strong>Empreiteiro Responsável:</strong> {obra.contractor}</p>
              <p><strong>Data da Vistoria:</strong> {new Date(obra.date).toLocaleDateString('pt-BR')}</p>
            </div>

            <div style={{ margin: '30px 0', fontSize: '16px', lineHeight: '1.6' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Descrição do Andamento</h3>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{obra.description}</p>
            </div>

            <div style={{ margin: '20px 0' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>Registro Fotográfico</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {obra.photos.map((photo, i) => photo && (
                  <img key={i} src={photo} alt={`Foto ${i + 1}`} style={{ maxWidth: '85%', maxHeight: '210px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ccc', textAlign: 'center', color: '#666', fontSize: '14px' }}>
              <p>Relatório gerado automaticamente pelo Sistema KRM de Acompanhamento de Obras.</p>
              <p style={{ marginTop: '5px' }}>Obra {idx + 1} de {obras.length}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
