import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, ScanFace } from 'lucide-react';
import API from '../utils/api';

const FaceTestingModule = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setResult(null);
      setError('');
    }
  };

  const handleTestRecognition = async () => {
    if (!previewUrl) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Use the exact same endpoint the webcam uses
      const response = await API.post('/attendance/mark-face', { image: previewUrl });
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.message || 'Recognition failed');
      }
    } catch (err) {
      console.error('Test API error:', err);
      setError(err.response?.data?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Face Recognition Testing Module</h2>
        <p className="text-sm text-slate-500 font-medium">Upload static images to test AI recognition accuracy and confidence scores.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <div className="glass-card p-6 bg-white flex flex-col items-center">
          <div className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-64 w-full object-contain rounded-xl" />
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <span className="block text-sm font-bold text-slate-600">Select an image to test</span>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-6 block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer transition-colors"
            />
          </div>

          <button
            onClick={handleTestRecognition}
            disabled={!previewUrl || loading}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50 transition-all"
          >
            <ScanFace className="h-5 w-5" />
            {loading ? 'Analyzing AI Embeddings...' : 'Run Recognition Test'}
          </button>
        </div>

        {/* Results Section */}
        <div className="glass-card p-6 bg-white">
          <h3 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Analysis Results</h3>
          
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 border border-rose-100">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold text-slate-400">Awaiting Image Input</span>
              <span className="text-xs text-slate-400 mt-1">Upload a photo to see matching metrics.</span>
            </div>
          )}

          {loading && (
            <div className="h-48 flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent mb-4"></div>
              <span className="text-sm font-bold text-slate-500 animate-pulse">Running Neural Network...</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {result.faces && result.faces.length > 0 ? (
                result.faces.map((face, index) => (
                  <div key={index} className={`rounded-xl p-4 border ${face.matched ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {face.matched ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
                      <span className={`font-black text-sm ${face.matched ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {face.matched ? 'Match Found' : 'Unrecognized Face'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                      <div>
                        <span className="block font-bold text-slate-400 uppercase tracking-wider mb-0.5">Confidence</span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {Math.round(face.confidence * 100)}%
                        </span>
                      </div>
                      
                      {face.student && (
                        <>
                          <div>
                            <span className="block font-bold text-slate-400 uppercase tracking-wider mb-0.5">Student Name</span>
                            <span className="font-bold text-slate-800">{face.student.name}</span>
                          </div>
                          <div>
                            <span className="block font-bold text-slate-400 uppercase tracking-wider mb-0.5">Roll Number</span>
                            <span className="font-mono font-bold text-slate-800">{face.student.rollNumber}</span>
                          </div>
                        </>
                      )}
                      
                      <div>
                        <span className="block font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bounding Box</span>
                        <span className="font-mono text-slate-600">[{face.bbox.join(', ')}]</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700 border border-amber-100">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>No faces detected in the provided image.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceTestingModule;
