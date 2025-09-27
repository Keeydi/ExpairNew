"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";

export default function UploadProofDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Upload your proof", 
  mode = "upload",
  tradereq_id = null // Add this prop to fetch existing proof
}) {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch existing proof when in view mode
  useEffect(() => {
    const fetchExistingProof = async () => {
      if (!isOpen || mode !== "view" || !tradereq_id || !session?.access) return;
      
      setLoading(true);
      try {
        // Fetch user's own proof (you'll need to create this endpoint)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-proof/${tradereq_id}/my-proof/`,
          {
            headers: {
              'Authorization': `Bearer ${session.access}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const proofData = await response.json();
          if (proofData.proof_file) {
            // Convert server proof to local file format
            const existingFile = {
              name: proofData.proof_file.name,
              file: null, // We don't have the actual File object
              isImage: proofData.proof_file.is_image,
              preview: proofData.proof_file.is_image ? proofData.proof_file.url : null,
              url: proofData.proof_file.url, // Add URL for viewing
              isExisting: true // Flag to indicate this is from server
            };
            setUploadedFiles([existingFile]);
          }
        } else {
          console.error("Failed to fetch existing proof");
        }
      } catch (error) {
        console.error("Error fetching existing proof:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingProof();
  }, [isOpen, mode, tradereq_id, session]);

  // Reset files when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Cleanup preview URLs
      uploadedFiles.forEach(file => {
        if (file.preview && !file.isExisting) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setUploadedFiles([]);
    }
  }, [isOpen]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview && !file.isExisting) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      file: file,
      isImage: file.type.startsWith('image/'),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isExisting: false
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileName) => {
    const fileToRemove = uploadedFiles.find(file => file.name === fileName);
    if (fileToRemove && fileToRemove.preview && !fileToRemove.isExisting) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setUploadedFiles(uploadedFiles.filter(file => file.name !== fileName));
  };

  const viewFile = (file) => {
    if (file.isExisting && file.url) {
      // For existing files from server, use the server URL
      window.open(file.url, '_blank');
    } else if (file.file) {
      // For new files, create object URL
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
    }
  };

  const downloadFile = (file) => {
    if (file.isExisting && file.url) {
      // For existing files, download from server
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.file) {
      // For new files, create download link
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const downloadAllFiles = () => {
    if (uploadedFiles.length === 0) return;
    
    uploadedFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 100);
    });
  };

  const handleSubmit = () => {
    if (uploadedFiles.length > 0) {
      // Only submit non-existing files (new uploads)
      const newFiles = uploadedFiles.filter(file => !file.isExisting);
      if (newFiles.length > 0) {
        onSubmit(newFiles);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div 
        className="w-[650px] max-h-[90vh] flex flex-col p-[40px] relative overflow-y-auto"
        style={{
          background: "rgba(0, 0, 0, 0.05)",
          border: "2px solid #0038FF",
          boxShadow: "0px 4px 15px #D78DE5",
          backdropFilter: "blur(30px)",
          borderRadius: "15px"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-[25px] right-[25px] text-white hover:text-gray-300"
        >
          <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
        </button>

        <div className="flex flex-col items-center gap-[30px] w-full mt-[20px]">
          {/* Title */}
          <div className="flex flex-col items-center w-full mb-[10px]">
            <h2 className="text-[28px] font-bold text-white text-center">
              {title}
            </h2>
          </div>

          {/* Upload area (only in upload mode) */}
          {mode === "upload" && (
            <div 
              className={`w-full h-[280px] border-2 border-dashed rounded-[25px] flex flex-col items-center justify-center ${dragActive ? 'border-white' : 'border-white/60'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-[15px]">
                <Icon icon="lucide:cloud-upload" className="w-[120px] h-[80px] text-white/40" />
                <p className="text-[18px] text-white/60 text-center">
                  Drag and drop your files here
                </p>
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="mt-[30px] px-[60px] py-[15px] border border-white rounded-[12px] text-[14px] text-white hover:bg-[#1A0F3E] transition-colors"
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
              />
            </div>
          )}

          {/* Uploaded files */}
          <div className="flex flex-col gap-[25px] w-full">
            <p className="text-[18px] text-white font-medium">
              {mode === "view" ? "Your submitted proof" : "Uploaded file(s)"}
            </p>
            
            <div className="flex flex-col gap-[12px] w-full min-h-[70px]">
              {loading ? (
                <div className="h-[70px] flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-white/60" />
                    <p className="text-[14px] text-white/60">Loading your proof...</p>
                  </div>
                </div>
              ) : uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex flex-row justify-between items-center p-[20px] bg-[#120A2A] rounded-[12px] shadow-lg w-full"
                  >
                    <div className="flex items-center gap-[15px] min-w-0 flex-1">
                      {file.isImage && file.preview ? (
                        <div className="w-[50px] h-[50px] rounded-[8px] overflow-hidden flex-shrink-0 border border-white/20">
                          <img 
                            src={file.preview} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[50px] h-[50px] rounded-[8px] bg-[#1A0F3E] border border-white/20 flex items-center justify-center flex-shrink-0">
                          <Icon icon="lucide:file" className="w-[24px] h-[24px] text-white/60" />
                        </div>
                      )}
                      <div className="flex flex-col gap-[2px] min-w-0 flex-1">
                        <span className="text-[16px] text-white truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[12px] text-white/50">
                          {file.isImage ? 'Image file' : 'Document'}
                          {file.isExisting && (
                            <span className="ml-2 px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs">
                              Submitted
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[12px] flex-shrink-0">
                      <button 
                        onClick={() => viewFile(file)} 
                        className="hover:bg-white/10 p-2 rounded transition-colors"
                        title="View file"
                      >
                        <Icon icon="lucide:eye" className="w-[20px] h-[20px] text-white" />
                      </button>
                      {mode === "view" && (
                        <button 
                          onClick={() => downloadFile(file)} 
                          className="hover:bg-white/10 p-2 rounded transition-colors"
                          title="Download file"
                        >
                          <Icon icon="lucide:download" className="w-[20px] h-[20px] text-white" />
                        </button>
                      )}
                      {mode === "upload" && !file.isExisting && (
                        <button 
                          onClick={() => removeFile(file.name)} 
                          className="hover:bg-white/10 p-2 rounded transition-colors"
                          title="Remove file"
                        >
                          <Icon icon="lucide:x" className="w-[20px] h-[20px] text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-[70px] flex items-center justify-center">
                  <p className="text-[14px] text-white/40">
                    {mode === "view" ? "No proof found" : "No files uploaded yet"}
                  </p>
                </div>
              )}
            </div>
            
            {mode === "upload" && (
              <div className="space-y-3 mt-[15px]">
                <p className="text-[14px] text-white/50 text-center leading-relaxed">
                  Files and final approval are withheld from the other party until both users upload their outputs. Ensure that the file you have uploaded is final, as this will not become editable after. Files and final approval are withheld from the other party until both users upload their outputs.
                </p>
              </div>
            )}
          </div>

          {/* Submit and Download buttons */}
          <div className="flex justify-center items-center gap-[15px] mt-[25px] mb-[10px]">
            {mode === "view" && (
              <button
                onClick={downloadAllFiles}
                disabled={uploadedFiles.length === 0 || loading}
                className="w-[180px] h-[45px] rounded-[15px] text-white text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: "#0038FF",
                  boxShadow: "0px 0px 15px rgba(40, 76, 204, 0.6)"
                }}
              >
                <div className="flex items-center justify-center gap-[8px]">
                  <Icon icon="lucide:download" className="w-[18px] h-[18px]" />
                  <span>Download</span>
                </div>
              </button>
            )}
            {mode === "upload" && (
              <button
                onClick={handleSubmit}
                disabled={uploadedFiles.filter(f => !f.isExisting).length === 0}
                className="w-[180px] h-[45px] bg-[#0038FF] rounded-[15px] text-white text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0042FF] transition-colors"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}