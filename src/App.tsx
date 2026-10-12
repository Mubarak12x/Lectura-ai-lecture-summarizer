/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { jsPDF } from "jspdf";
import { 
  FileText, Settings, BarChart2, User, LogOut, 
  Play, Download, Save, CheckCircle, 
  AlertCircle, BookOpen, Cpu, Shield, Menu, X, Copy,
  RefreshCw, FileUp, History, Sparkles, AlignLeft, Upload, Video,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Components ---

const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, icon: Icon }: any) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";
  
  const variants: any = {
    primary: "bg-brand text-white hover:bg-brand-hover shadow-lg shadow-blue-500/20 focus:ring-brand",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    accent: "bg-brand-soft text-brand hover:bg-blue-100 focus:ring-brand"
  };

  const sizes: any = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className={`${children ? 'mr-2' : ''} w-4 h-4`} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, subtitle, action, variant = 'default', onClick }: any) => (
  <div 
    onClick={onClick}
    className={`
    ${variant === 'bento' ? 'bento-card' : 'bg-white rounded-2xl border border-slate-100 shadow-sm'} 
    overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}
  `}>
    {(title || subtitle) && (
      <div className="px-6 py-5 flex justify-between items-center">
        <div>
          {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={`${(title || subtitle) ? 'px-6 pb-6 pt-2' : 'p-6'}`}>
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    processing: "bg-brand-soft text-brand",
    error: "bg-red-100 text-red-700"
  };
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ steps, currentStep }: any) => (
  <div className="w-full mb-8 min-w-[600px] sm:min-w-0">
    <div className="flex items-center justify-between relative">
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-500"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      ></div>
      {steps.map((step: string, idx: number) => (
        <div key={idx} className="flex flex-col items-center bg-white px-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
            idx <= currentStep ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400'
          }`}>
            {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-medium">{idx + 1}</span>}
          </div>
          <span className={`mt-2 text-xs font-medium ${idx <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MetricCard = ({ label, value, subtext, trend }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm hover:shadow-md transition-all">
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <div className="flex items-end justify-between">
      <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
  </div>
);

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole] = useState('student'); // student, lecturer, admin
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data states
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryType, setSummaryType] = useState('hybrid'); // extractive, abstractive, hybrid
  const [compressionRatio, setCompressionRatio] = useState(30);
  const [evaluationMetrics, setEvaluationMetrics] = useState<any>(null);

  // New states for Chat and History
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([
    { id: 1, title: 'CS224N Lecture 5: Transformers', date: '2 hours ago', status: 'completed', type: 'Hybrid', summary: 'This lecture covered the basics of transformer architectures...' },
    { id: 2, title: 'History 101: Industrial Revolution', date: 'Yesterday', status: 'completed', type: 'Extractive', summary: 'Discussion on the impact of steam power on textile manufacturing...' },
    { id: 3, title: 'Bio 220: Cellular Respiration', date: '3 days ago', status: 'processing', type: 'Abstractive', summary: '' }
  ]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  // New states for Audio Upload
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for Video Upload
  const [isVideoTranscribing, setIsVideoTranscribing] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingOverInput, setIsDraggingOverInput] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const processingSteps = ['Input', 'Preprocessing', 'Summarization', 'Evaluation', 'Output'];

  // Real processing pipeline using Gemini
  const handleProcess = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setProcessingStep(0);
    setSummary('');
    setEvaluationMetrics(null);

    try {
      // Step 1: Preprocessing (Simulated)
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Summarization (Real Gemini Call)
      setProcessingStep(2);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        Summarize the following lecture transcript. 
        Method: ${summaryType}
        Target Compression: ${compressionRatio}% of original length.
        
        Please provide a highly structured and actionable output in Markdown:
        1. **Abstract**: A brief 2-3 sentence overview of the lecture's core purpose.
        2. **Key Takeaways**: A bulleted list of the most critical actionable insights or conclusions (aim for 3-5).
        3. **Structured Summary**: The main body of the summary based on the ${summaryType} method, organized by sub-topics if applicable.
        
        Transcript:
        ${transcript}
      `;

      const systemInstruction = `
        You are an expert academic assistant specializing in high-fidelity lecture summarization.
        Your goal is to transform messy transcripts into polished, structured, and actionable study materials.
        
        Instructions:
        - Maintain academic rigor while ensuring clarity.
        - Use bolding for key terms and concepts.
        - If the method is 'extractive', ensure the most salient points are preserved in their original context.
        - If the method is 'abstractive', prioritize synthesis and conceptual narrative.
        - If the method is 'hybrid', balance depth with readability.
        - STRICTLY removal of disfluencies (um, uh, like, you know) and administrative filler.
        - Ensure the output is formatted as valid Markdown.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const generatedSummary = response.text || "Failed to generate summary.";
      setSummary(generatedSummary);

      // Step 3: Evaluation (Simulated)
      setProcessingStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvaluationMetrics({
        rouge1: 0.35 + Math.random() * 0.1,
        rouge2: 0.20 + Math.random() * 0.1,
        rougeL: 0.30 + Math.random() * 0.1,
        bertscore: 0.85 + Math.random() * 0.1,
        compression: compressionRatio
      });

      setProcessingStep(4);
    } catch (error) {
      console.error("Summarization error:", error);
      setSummary("An error occurred during summarization. Please check your API key and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSidebar = () => (
    <>
      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:flex
        fixed left-0 top-0 h-screen z-50 bg-white border-r border-slate-100 transition-all duration-300 flex-col
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-900">Lectura</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {[ 
            { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
            { id: 'summarize', label: 'New Summary', icon: FileText },
            { id: 'upload', label: 'Upload Audio', icon: FileUp },
            { id: 'video', label: 'Upload Video', icon: Video },
            { id: 'chat', label: 'AI Chat', icon: Sparkles },
            { id: 'history', label: 'History', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            ...(userRole === 'admin' ? [{ id: 'admin', label: 'Administration', icon: Shield }] : []),
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-soft text-brand font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-brand' : 'text-slate-400'}`} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">Mubarak Ahmed</p>
                <p className="text-xs text-slate-500 capitalize">{userRole}</p>
              </div>
            )}
            {sidebarOpen && <LogOut className="w-4 h-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors shrink-0" />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
        {[ 
          { id: 'dashboard', icon: BookOpen },
          { id: 'summarize', icon: FileText },
          { id: 'upload', icon: FileUp },
          { id: 'video', icon: Video },
          { id: 'chat', icon: Sparkles },
          { id: 'history', icon: History },
          { id: 'settings', icon: Settings }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`p-2 rounded-xl transition-all ${
              activeTab === item.id ? 'bg-brand-soft text-brand' : 'text-slate-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </>
  );

  const renderMobileHeader = () => (
    <div className="lg:hidden flex items-center justify-between p-5 bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-900">Lectura</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverInput(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverInput(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverInput(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setTranscript(event.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .txt file");
      }
    }
  };

  const handleSaveToHistory = () => {
    if (!summary) return;
    const newItem = {
      id: Date.now(),
      title: transcript.slice(0, 30).trim() + '...',
      date: 'Just now',
      status: 'completed',
      type: summaryType.charAt(0).toUpperCase() + summaryType.slice(1),
      summary: summary
    };
    setHistoryItems(prev => [newItem, ...prev]);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setSaveStatus('Copied!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleExportText = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lectura_Summary_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!summary) return;
    try {
      const doc = new jsPDF();
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const splitText = doc.splitTextToSize(summary, pageWidth - (margin * 2));
      
      doc.setFontSize(16);
      doc.text("Lectura AI Summary", margin, 20);
      doc.setFontSize(10);
      doc.text(`Method: ${summaryType} | Created: ${new Date().toLocaleString()}`, margin, 28);
      
      doc.setFontSize(11);
      doc.text(splitText, margin, 40);
      
      doc.save(`Lectura_Summary_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export PDF. Exporting as Text instead.");
      handleExportText();
    }
  };

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your academic transcripts and AI summaries</p>
        </div>
        <Button onClick={() => setActiveTab('summarize')} icon={FileText} className="w-full sm:w-auto">New Transcript</Button>
      </div>

      {/* Bento Grid Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card variant="bento" className="p-8 flex flex-col items-center text-center group cursor-pointer" onClick={() => setActiveTab('summarize')}>
          <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-brand" />
          </div>
          <h4 className="font-bold text-slate-900">Summarize</h4>
          <p className="text-sm text-slate-500 mt-1">Text to summary</p>
        </Card>
        <Card variant="bento" className="p-8 flex flex-col items-center text-center group cursor-pointer" onClick={() => setActiveTab('upload')}>
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileUp className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="font-bold text-slate-900">Audio</h4>
          <p className="text-sm text-slate-500 mt-1">MP3, WAV, M4A</p>
        </Card>
        <Card variant="bento" className="p-8 flex flex-col items-center text-center group cursor-pointer" onClick={() => setActiveTab('video')}>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Video className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-bold text-slate-900">Video</h4>
          <p className="text-sm text-slate-500 mt-1">MP4, MOV, WEBM</p>
        </Card>
        <Card variant="bento" className="p-8 flex flex-col items-center text-center group cursor-pointer" onClick={() => setActiveTab('history')}>
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <History className="w-8 h-8 text-amber-600" />
          </div>
          <h4 className="font-bold text-slate-900">History</h4>
          <p className="text-sm text-slate-500 mt-1">Past summaries</p>
        </Card>
        <Card variant="bento" className="p-8 flex flex-col items-center text-center group cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-bold text-slate-900">AI Chat</h4>
          <p className="text-sm text-slate-500 mt-1">Ask questions</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Recent Summaries" subtitle="Your latest processing jobs">
          <div className="space-y-4">
            {[ 
              { title: 'CS224N Lecture 5: Transformers', date: '2 hours ago', status: 'completed', type: 'Hybrid' },
              { title: 'History 101: Industrial Revolution', date: 'Yesterday', status: 'completed', type: 'Extractive' },
              { title: 'Bio 220: Cellular Respiration', date: '3 days ago', status: 'processing', type: 'Abstractive' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 hover:border-brand-soft hover:bg-brand-soft/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-soft text-brand'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.date} • {item.type}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'completed' ? 'success' : 'processing'}>
                  {item.status === 'completed' ? 'Completed' : 'Processing'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Quick Stats">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Total" value="24" />
              <MetricCard label="Quality" value="0.87" />
            </div>
          </Card>
          <Card title="Storage" subtitle="Usage overview">
            <div className="space-y-4">
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-brand h-3 rounded-full shadow-sm" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">2.3 GB of 5 GB</span>
                <span className="text-brand font-bold">45%</span>
              </div>
              <Button variant="accent" size="sm" className="w-full">Upgrade Storage</Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  const renderSummarization = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Summary</h1>
          <p className="text-slate-500 mt-1">AI-powered academic synthesis</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" icon={FileUp} className="flex-1 md:flex-none">Upload</Button>
          <Button variant="primary" icon={Play} onClick={handleProcess} disabled={!transcript.trim() || isProcessing} className="flex-1 md:flex-none">
            {isProcessing ? 'Processing...' : 'Generate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
        {/* Left: Input & Config */}
        <div className="lg:col-span-4 space-y-6">
          <Card title="Input" subtitle="Transcript content">
            <div 
              className={`relative rounded-2xl border-2 border-dashed transition-all ${
                isDraggingOverInput ? 'border-brand bg-brand-soft/30' : 'border-transparent'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <textarea
                value={transcript}
                onChange={(e: any) => setTranscript(e.target.value)}
                placeholder="Paste lecture transcript or drag & drop a .txt file here..."
                className="w-full h-[400px] p-5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all resize-none text-sm leading-relaxed"
                disabled={isProcessing}
              />
              {isDraggingOverInput && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-soft/80 backdrop-blur-sm rounded-2xl z-10 pointer-events-none">
                  <Upload className="w-10 h-10 text-brand mb-2 animate-bounce" />
                  <p className="font-bold text-brand">Drop to upload transcript</p>
                </div>
              )}
            </div>
          </Card>
          
          <Card title="Settings">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Method</label>
                <div className="flex flex-wrap gap-2">
                  {['extractive', 'abstractive', 'hybrid'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSummaryType(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        summaryType === type 
                          ? 'bg-brand text-white border-brand shadow-md shadow-blue-500/20' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Compression: {compressionRatio}%</label>
                <input 
                  type="range" 
                  min="10" 
                  max="90" 
                  value={compressionRatio}
                  onChange={(e: any) => setCompressionRatio(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-8">
          <Card 
            className="h-full min-h-[600px] flex flex-col"
            title="Result"
            action={
              summary && (
                <div className="flex gap-2">
                  <AnimatePresence>
                    {saveStatus && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-emerald-600 text-xs font-bold self-center mr-2 px-2 py-1 bg-emerald-50 rounded-full flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> {saveStatus}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <Button variant="ghost" size="sm" icon={Save} onClick={handleSaveToHistory} title="Save to History">Save</Button>
                  <Button variant="ghost" size="sm" icon={Copy} onClick={handleCopySummary} title="Copy to Clipboard">Copy</Button>
                  <div className="relative group">
                    <Button variant="ghost" size="sm" icon={Download}>Export</Button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all invisible group-hover:visible z-50 overflow-hidden">
                      <button onClick={handleExportText} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Plain Text (.txt)
                      </button>
                      <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-50">
                        <FileText className="w-4 h-4 text-red-500" /> PDF Document
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          >
            {isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-brand-soft border-t-brand rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">AI is thinking...</p>
                  <p className="text-slate-500 text-sm mt-1">{processingSteps[processingStep]}</p>
                </div>
                <div className="w-64">
                  <ProgressBar steps={processingSteps} currentStep={processingStep} />
                </div>
              </div>
            ) : summary ? (
              <div className="prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-3xl border border-slate-50 text-slate-800 leading-relaxed markdown-body shadow-sm">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ready to Summarize</h3>
                <p className="text-slate-500 mt-2 max-w-xs">Enter your transcript on the left and click generate to see the magic happen.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model,
        contents: chatInput,
        config: {
          systemInstruction: "You are an academic assistant. Help the user understand their lecture content. Be concise and professional.",
        }
      });
      const aiMsg = { role: 'model', text: response.text || "I couldn't process that." };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderChat = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col gap-6"
    >
      <div className="flex justify-between items-center px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Chat</h1>
          <p className="text-slate-500 mt-1">Ask questions about your lectures</p>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={() => setChatMessages([])}>Clear</Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Sparkles className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Start a Conversation</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Ask me anything about your lecture content or academic topics.</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-brand text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100'
                }`}>
                  <div className="text-sm leading-relaxed markdown-body">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Type your question..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
            <Button onClick={handleChatSend} disabled={isChatLoading || !chatInput.trim()} icon={Play}>Send</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderHistory = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">History</h1>
        <p className="text-slate-500 mt-1">Access your past summaries and transcripts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
        <div className="lg:col-span-4 space-y-4">
          {historyItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedHistoryItem(item)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                selectedHistoryItem?.id === item.id 
                  ? 'bg-brand-soft border-brand shadow-sm' 
                  : 'bg-white border-slate-50 hover:border-brand-soft hover:bg-brand-soft/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-soft text-brand'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold truncate ${selectedHistoryItem?.id === item.id ? 'text-brand' : 'text-slate-900'}`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500">{item.date} • {item.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8">
          {selectedHistoryItem ? (
            <Card title={selectedHistoryItem.title} subtitle={`${selectedHistoryItem.date} • ${selectedHistoryItem.type}`}>
              <div className="prose prose-slate max-w-none">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed">
                  {selectedHistoryItem.summary || "No summary available for this item."}
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="secondary" size="sm" icon={Download}>Download PDF</Button>
                  <Button variant="ghost" size="sm" icon={Copy}>Copy Text</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-slate-200 rounded-[32px]">
              <FileText className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Select an Item</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Click on a history item to view its details and summary.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.m4a')) {
      alert("Please upload a supported audio format (MP3, WAV, M4A).");
      return;
    }

    setIsTranscribing(true);
    setTranscript('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const model = "gemini-3-flash-preview";

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: file.type || 'audio/mpeg',
                data: base64Data,
              },
            },
            {
              text: "Please provide a highly accurate, verbatim transcription of this audio file. Remove any background noise or non-speech sounds. Output only the transcript text.",
            },
          ],
        });

        const transcription = response.text || "Transcription failed.";
        setTranscript(transcription);
        setActiveTab('summarize');
        setIsTranscribing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("An error occurred during transcription. Please try again.");
      setIsTranscribing(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a supported video format (MP4, MOV, AVI, WEBM).");
      return;
    }

    setIsVideoTranscribing(true);
    setTranscript('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const model = "gemini-3-flash-preview";

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: file.type || 'video/mp4',
                data: base64Data,
              },
            },
            {
              text: "Please provide a highly accurate, verbatim transcription of the speech in this video. Output only the transcript text.",
            },
          ],
        });

        const transcription = response.text || "Transcription failed.";
        setTranscript(transcription);
        setActiveTab('summarize');
        setIsVideoTranscribing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Video transcription error:", error);
      alert("An error occurred during video transcription. Please try again.");
      setIsVideoTranscribing(false);
    }
  };

  const renderUpload = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Audio</h1>
        <p className="text-slate-500 mt-2">Upload your lecture recordings for automatic transcription and summarization</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".mp3,.wav,.m4a,.mp4" 
        className="hidden" 
      />

      <Card 
        variant="bento" 
        className={`p-12 border-2 border-dashed transition-all group cursor-pointer ${
          isTranscribing ? 'border-brand bg-brand-soft/20 pointer-events-none' : 'border-slate-200 hover:border-brand hover:bg-brand-soft/10'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-transform ${
            isTranscribing ? 'bg-brand-soft' : 'bg-brand-soft group-hover:scale-110'
          }`}>
            {isTranscribing ? (
              <RefreshCw className="w-10 h-10 text-brand animate-spin" />
            ) : (
              <FileUp className="w-10 h-10 text-brand" />
            )}
          </div>
          
          {isTranscribing ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 text-center">Transcribing Audio...</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Our AI is converting your speech to text. This may take a moment depending on the file length.</p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-900">Drag and drop your audio here</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Supports MP3, WAV, M4A, and MP4. Max file size: 50MB.</p>
              <div className="mt-8">
                <Button icon={Upload}>Select File</Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Supported Formats">
          <div className="flex flex-wrap gap-2">
            {['MP3', 'WAV', 'M4A', 'MP4', 'AAC'].map(f => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Card>
        <Card title="Transcription Quality">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold">99% Accuracy with AI Engine</span>
          </div>
        </Card>
      </div>
    </motion.div>
  );

  const renderVideoUpload = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Video</h1>
        <p className="text-slate-500 mt-2">Upload your lecture videos for automatic transcription and summarization</p>
      </div>

      <input 
        type="file" 
        ref={videoInputRef} 
        onChange={handleVideoUpload} 
        accept=".mp4,.mov,.avi,.webm" 
        className="hidden" 
      />

      <Card 
        variant="bento" 
        className={`p-12 border-2 border-dashed transition-all group cursor-pointer ${
          isVideoTranscribing ? 'border-brand bg-brand-soft/20 pointer-events-none' : 'border-slate-200 hover:border-brand hover:bg-brand-soft/10'
        }`}
        onClick={() => videoInputRef.current?.click()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-transform ${
            isVideoTranscribing ? 'bg-brand-soft' : 'bg-brand-soft group-hover:scale-110'
          }`}>
            {isVideoTranscribing ? (
              <RefreshCw className="w-10 h-10 text-brand animate-spin" />
            ) : (
              <Video className="w-10 h-10 text-brand" />
            )}
          </div>
          
          {isVideoTranscribing ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 text-center">Transcribing Video...</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Our AI is extracting speech from your video. This may take a moment depending on the file size.</p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-900">Drag and drop your video here</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Supports MP4, MOV, AVI, and WEBM. Max file size: 50MB.</p>
              <div className="mt-8">
                <Button icon={Upload}>Select Video File</Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Supported Formats">
          <div className="flex flex-wrap gap-2">
            {['MP4', 'MOV', 'AVI', 'WEBM'].map(f => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Card>
        <Card title="AI Transcription">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold">High-precision speech extraction</span>
          </div>
        </Card>
      </div>
    </motion.div>
  );

  const renderAdmin = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Admin</h1>
          <p className="text-slate-500 mt-1">Monitor and configure the summarization engine</p>
        </div>
        <Badge variant="warning">Admin Access</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card title="Model Management" subtitle="NLP Engine Configuration">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">BART-large-CNN</p>
                <p className="text-xs text-slate-500">Abstractive Model</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">PEGASUS-XSum</p>
                <p className="text-xs text-slate-500">Abstractive Model</p>
              </div>
              <Badge variant="default">Standby</Badge>
            </div>
            <Button variant="secondary" className="w-full" icon={Cpu}>Update Models</Button>
          </div>
        </Card>

        <Card title="System Statistics" subtitle="Usage analytics">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Active Users</span>
              <span className="font-bold text-slate-900">142</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Transcripts Today</span>
              <span className="font-bold text-slate-900">38</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Avg. Processing</span>
              <span className="font-bold text-slate-900">3.8s</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">System Load</span>
              <span className="font-bold text-emerald-600">24%</span>
            </div>
          </div>
        </Card>

        <Card title="Data Management" subtitle="Storage & Datasets">
          <div className="space-y-4">
            <div className="p-4 bg-brand-soft rounded-2xl border border-blue-100">
              <p className="text-sm font-bold text-brand">Dataset Storage</p>
              <p className="text-xs text-slate-500 mt-1">12.4 GB used of 50 GB</p>
              <div className="w-full bg-white rounded-full h-2 mt-3">
                <div className="bg-brand h-2 rounded-full shadow-sm" style={{ width: '25%' }}></div>
              </div>
            </div>
            <Button variant="secondary" className="w-full" icon={Upload}>Upload Dataset</Button>
            <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" icon={AlertCircle}>
              Clear Cache
            </Button>
          </div>
        </Card>
      </div>

      <Card title="System Logs" subtitle="Recent activity monitoring">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-slate-500 font-medium">2024-01-15 14:32</td>
                  <td className="px-6 py-4 font-bold text-slate-900">student_{i + 203}</td>
                  <td className="px-6 py-4 text-slate-600">Hybrid Summarization</td>
                  <td className="px-6 py-4"><Badge variant="success">Success</Badge></td>
                  <td className="px-6 py-4 text-slate-500 font-medium">4.2s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return renderDashboard();
      case 'summarize': return renderSummarization();
      case 'upload': return renderUpload();
      case 'video': return renderVideoUpload();
      case 'history': return renderHistory();
      case 'chat': return renderChat();
      case 'admin': return renderAdmin();
      case 'analytics': return (
        <div className="text-center py-20 text-slate-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Analytics dashboard with trends and insights would appear here</p>
        </div>
      );
      case 'settings': return (
        <div className="text-center py-20 text-slate-400">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>User preferences and account settings would appear here</p>
        </div>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 lg:pb-0">
      {renderSidebar()}
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {renderMobileHeader()}
        
        <main className="p-4 sm:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
