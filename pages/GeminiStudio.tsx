import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as GeminiService from '../services/geminiService';
import Card from '../components/Card';
import { 
    MessageSquare, Image as ImageIcon, Video, Mic, BrainCircuit, Bot, User, Search, Map, Send, Upload, Wand2, Scissors, Play, Loader2, StopCircle, Check, Copy, AlertTriangle
} from 'lucide-react';
// Fix: Removed non-exported types LiveSession and GenerateContentRequest. Added Content type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob, Content } from '@google/genai';

// --- HELPER COMPONENTS ---

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => (
    <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
        <Loader2 className="animate-spin h-8 w-8 text-teal-500" />
        <p className="text-sm font-medium">{text}</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
        <p><strong>Error:</strong> {message}</p>
    </div>
);

// --- MAIN FEATURE COMPONENTS ---

const ChatComponent = () => {
    // Fix: Replaced deprecated GenerateContentRequest['contents'] with Content[]
    const [messages, setMessages] = useState<Content[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [useLite, setUseLite] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        
        const userMessage: any = { role: 'user', parts: [{ text: input }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');

        try {
            const response = await GeminiService.generateChatResponse(messages, input, useSearch, useMaps, useLite);
            const modelMessage: any = { role: 'model', parts: [{ text: response.text }], groundingMetadata: response.candidates?.[0]?.groundingMetadata };
            setMessages([...newMessages, modelMessage]);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="AI Chat">
            <div className="flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    {messages.map((msg: any, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <Bot className="w-6 h-6 text-teal-500 flex-shrink-0"/>}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</p>
                                {msg.groundingMetadata?.groundingChunks?.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                        <h4 className="text-xs font-bold mb-1">Sources:</h4>
                                        <ul className="text-xs space-y-1">
                                            {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                                                <li key={i}>
                                                    <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block">
                                                        {chunk.web?.title || chunk.maps?.title || 'Source Link'}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                             {msg.role === 'user' && <User className="w-6 h-6 text-blue-500 flex-shrink-0"/>}
                        </div>
                    ))}
                    {isLoading && <LoadingSpinner />}
                </div>
                {error && <ErrorDisplay message={error}/>}
                <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <div className="flex items-center space-x-2 mb-2">
                         <label className="flex items-center text-sm space-x-1 cursor-pointer"><input type="checkbox" checked={useSearch} onChange={e => setUseSearch(e.target.checked)} /> <Search size={14}/> <span>Search</span></label>
                         <label className="flex items-center text-sm space-x-1 cursor-pointer"><input type="checkbox" checked={useMaps} onChange={e => setUseMaps(e.target.checked)} /> <Map size={14}/> <span>Maps</span></label>
                         <label className="flex items-center text-sm space-x-1 cursor-pointer"><input type="checkbox" checked={useLite} onChange={e => setUseLite(e.target.checked)} /> <Wand2 size={14}/> <span>Fast Mode</span></label>
                    </div>
                    <div className="flex items-center gap-2">
                        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask anything..." rows={1} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none"/>
                        <button onClick={handleSend} disabled={isLoading} className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"><Send /></button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ImageStudioComponent = () => {
    const [subTab, setSubTab] = useState('generate');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResultImage(null);
                setAnalysisResult('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setResultImage(null);
        setAnalysisResult('');

        try {
            if (subTab === 'generate') {
                if (!prompt) throw new Error('Prompt is required.');
                const res = await GeminiService.generateImage(prompt, aspectRatio);
                setResultImage(res);
            } else {
                if (!prompt) throw new Error('Prompt is required.');
                if (!imageFile) throw new Error('Image is required.');
                const imageBase64 = await GeminiService.blobToBase64(imageFile);
                if (subTab === 'analyze') {
                    const res = await GeminiService.analyzeImage(prompt, imageBase64, imageFile.type);
                    setAnalysisResult(res);
                } else if (subTab === 'edit') {
                    const res = await GeminiService.editImage(prompt, imageBase64, imageFile.type);
                    setResultImage(res);
                }
            }
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Image Studio">
            <div className="flex space-x-1 border-b mb-4">
                <button onClick={() => setSubTab('generate')} className={`px-4 py-2 ${subTab === 'generate' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Generate</button>
                <button onClick={() => setSubTab('analyze')} className={`px-4 py-2 ${subTab === 'analyze' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Analyze</button>
                <button onClick={() => setSubTab('edit')} className={`px-4 py-2 ${subTab === 'edit' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Edit</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    {subTab !== 'generate' && (
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Upload Image</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block font-medium mb-1">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder={subTab === 'generate' ? 'A photorealistic image of...' : subTab === 'analyze' ? 'What is in this image?' : 'Add a retro filter...'}/>
                    </div>
                    {subTab === 'generate' && (
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 capitalize flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : (subTab === 'generate' ? <Wand2/> : subTab === 'analyze' ? <Search/> : <Scissors/>)}
                        {subTab}
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[300px]">
                    {isLoading ? <LoadingSpinner /> : error ? <ErrorDisplay message={error} /> : 
                     resultImage ? <img src={resultImage} alt="Generated result" className="max-h-full max-w-full object-contain rounded-lg"/> :
                     analysisResult ? <p className="whitespace-pre-wrap">{analysisResult}</p> :
                     imagePreview ? <img src={imagePreview} alt="Upload preview" className="max-h-full max-w-full object-contain rounded-lg"/> :
                     <p className="text-gray-500">Your result will appear here.</p>
                    }
                </div>
            </div>
        </Card>
    );
};

const VideoStudioComponent = () => {
    const [subTab, setSubTab] = useState('text');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultVideo, setResultVideo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
            window.aistudio.hasSelectedApiKey().then(setApiKeySelected);
        } else {
            setApiKeySelected(true); // Assume available if aistudio context is not present
        }
    }, []);

    const handleSelectKey = async () => {
        if (typeof window.aistudio?.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success after opening dialog to handle race condition
            setApiKeySelected(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setResultVideo(null);
        setLoadingMessage('Initializing video generation...');
        try {
            const request: any = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt || (subTab === 'image' ? 'Animate this image.' : 'A beautiful landscape.'),
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio,
                }
            };
            if (subTab === 'image' && imageFile) {
                request.image = {
                    imageBytes: await GeminiService.blobToBase64(imageFile),
                    mimeType: imageFile.type,
                };
            }
            const messages = ["Polishing pixels...", "Compositing scenes...", "Rendering final output...", "This can take a few minutes."];
            const interval = setInterval(() => {
                setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);
            }, 5000);

            const videoUrl = await GeminiService.generateVideo(request);
            
            clearInterval(interval);
            setResultVideo(videoUrl);
        } catch (e: any) {
            if (e.message?.includes('Requested entity was not found')) {
                setError("API Key error. Please re-select your key.");
                setApiKeySelected(false);
            } else {
                setError(e.message || 'An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (apiKeySelected === null) {
        return <LoadingSpinner text="Checking API Key status..."/>
    }
    
    if (!apiKeySelected) {
         return (
            <Card title="API Key Required for Video Generation">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                    <p className="mt-4">Video generation with Veo requires a user-selected API key.</p>
                    <p className="text-sm text-gray-500 mt-1">This ensures you are aware of potential billing implications.</p>
                    <button onClick={handleSelectKey} className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">Select API Key</button>
                    <p className="mt-4 text-xs"><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Learn more about billing</a></p>
                </div>
            </Card>
        );
    }
    
    return (
        <Card title="Video Studio">
            <div className="flex space-x-1 border-b mb-4">
                <button onClick={() => setSubTab('text')} className={`px-4 py-2 ${subTab === 'text' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>From Text</button>
                <button onClick={() => setSubTab('image')} className={`px-4 py-2 ${subTab === 'image' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>From Image</button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    {subTab === 'image' && (
                        <div className="mb-4">
                            <label className="block font-medium mb-1">Upload Image</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block font-medium mb-1">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" placeholder={subTab === 'text' ? 'A cinematic shot of...' : 'Animate this image by...'}/>
                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-1">Aspect Ratio</label>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            {['16:9', '9:16'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 capitalize flex items-center justify-center gap-2">
                         {isLoading ? <Loader2 className="animate-spin" /> : <Play />}
                         Generate Video
                    </button>
                </div>
                 <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[300px]">
                    {isLoading ? <LoadingSpinner text={loadingMessage} /> : error ? <ErrorDisplay message={error} /> : 
                     resultVideo ? <video src={resultVideo} controls autoPlay loop className="max-h-full max-w-full rounded-lg"/> :
                     imagePreview ? <img src={imagePreview} alt="Upload preview" className="max-h-full max-w-full object-contain rounded-lg"/> :
                     <p className="text-gray-500">Your video will appear here.</p>
                    }
                </div>
            </div>
        </Card>
    );
};

const AudioSuiteComponent = () => {
    const [subTab, setSubTab] = useState('live');
    // TTS State
    const [ttsText, setTtsText] = useState('Hello! Have a wonderful day.');
    const [isTtsLoading, setIsTtsLoading] = useState(false);
    // Live & Transcription State
    const [isLive, setIsLive] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [liveOutput, setLiveOutput] = useState('');
    // Fix: Replaced non-exported LiveSession with any.
    const sessionRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext>();
    const outputAudioContextRef = useRef<AudioContext>();
    const scriptProcessorRef = useRef<ScriptProcessorNode>();
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode>();
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const stopLiveSession = useCallback(() => {
        if(sessionRef.current) {
            (sessionRef.current as any).close();
            sessionRef.current = null;
        }

        // Fix: Use disconnect() without arguments for robust cleanup. The TypeScript definitions for `disconnect` are incorrect and expect an argument. Casting to `any` bypasses this.
        if (mediaStreamSourceRef.current) {
            // Fix: Cast to any to call disconnect without arguments, bypassing incorrect TypeScript definitions.
            (mediaStreamSourceRef.current as any).disconnect();
        }
        if (scriptProcessorRef.current) {
            // Fix: Cast to any to call disconnect without arguments, bypassing incorrect TypeScript definitions.
            (scriptProcessorRef.current as any).disconnect();
        }

        inputAudioContextRef.current?.close();
        setIsLive(false);
    }, []);

    const startLiveSession = async () => {
        setIsLive(true);
        setTranscription('');
        setLiveOutput('');
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
            },
            callbacks: {
                onopen: () => {
                    mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob: GenaiBlob = {
                            // Fix: Corrected typo in PCM encoding multiplier from 3278 to 32768.
                            data: GeminiService.encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    if (msg.serverContent?.inputTranscription?.text) {
                        setTranscription(prev => prev + msg.serverContent!.inputTranscription!.text);
                    }
                     if (msg.serverContent?.outputTranscription?.text) {
                        setLiveOutput(prev => prev + msg.serverContent!.outputTranscription!.text);
                    }
                    if (msg.serverContent?.turnComplete) {
                        setTranscription(prev => prev + '\n');
                        setLiveOutput(prev => prev + '\n');
                    }
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        const outputCtx = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await GeminiService.decodeAudioData(GeminiService.decode(audioData), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                // Fix: Added typed event parameters to callbacks to match expected signature.
                onerror: (e: ErrorEvent) => { console.error(e); stopLiveSession(); },
                onclose: (e: CloseEvent) => { stream.getTracks().forEach(track => track.stop()); },
            }
        });
        sessionRef.current = await sessionPromise;
    };
    
    const handleTts = async () => {
        setIsTtsLoading(true);
        try {
            const base64Audio = await GeminiService.generateSpeech(ttsText);
            const outputCtx = outputAudioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputCtx;
            const audioBuffer = await GeminiService.decodeAudioData(GeminiService.decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            source.start();
        } catch (e: any) {
            alert(`TTS Error: ${e.message}`);
        } finally {
            setIsTtsLoading(false);
        }
    };

    return (
        <Card title="Audio Suite">
             <div className="flex space-x-1 border-b mb-4">
                <button onClick={() => setSubTab('live')} className={`px-4 py-2 ${subTab === 'live' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Live Conversation</button>
                <button onClick={() => setSubTab('tts')} className={`px-4 py-2 ${subTab === 'tts' ? 'border-b-2 border-teal-500 font-semibold' : ''}`}>Text-to-Speech</button>
            </div>
            {subTab === 'live' ? (
                 <div className="text-center">
                     {!isLive ? (
                        <button onClick={startLiveSession} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-green-700 flex items-center gap-2 mx-auto">
                            <Mic/> Start Live Session
                        </button>
                     ) : (
                        <button onClick={stopLiveSession} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:bg-red-700 flex items-center gap-2 mx-auto">
                            <StopCircle/> Stop Session
                        </button>
                     )}
                     <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                        <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[100px]">
                            <h4 className="font-semibold">You said:</h4>
                            <p className="text-sm whitespace-pre-wrap">{transcription}</p>
                        </div>
                        <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[100px]">
                            <h4 className="font-semibold">Gemini said:</h4>
                            <p className="text-sm whitespace-pre-wrap">{liveOutput}</p>
                        </div>
                     </div>
                 </div>
            ) : (
                <div className="space-y-4 max-w-lg mx-auto">
                    <label className="block font-medium mb-1">Text to Synthesize</label>
                    <textarea value={ttsText} onChange={e => setTtsText(e.target.value)} rows={4} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                    <button onClick={handleTts} disabled={isTtsLoading} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
                        {isTtsLoading ? <Loader2 className="animate-spin"/> : <Play/>}
                        Play Audio
                    </button>
                </div>
            )}
        </Card>
    )
};

const ComplexQueryComponent = () => {
    const [prompt, setPrompt] = useState('Analyze the provided customer data and suggest three targeted marketing campaigns to increase customer retention. For each campaign, specify the target audience, the core message, and the recommended service to promote.');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setResult('');
        try {
            const res = await GeminiService.runComplexQuery(prompt);
            setResult(res);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card title="Complex Reasoning & Data Analysis">
            <div className="space-y-4">
                <div>
                    <label className="block font-medium mb-1">Query Prompt</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"/>
                </div>
                <button onClick={handleSubmit} disabled={isLoading} className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin"/> : <BrainCircuit/>}
                    Run Complex Query
                </button>
                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 min-h-[200px]">
                    <h4 className="font-semibold mb-2">Result:</h4>
                    {isLoading ? <LoadingSpinner /> : error ? <ErrorDisplay message={error}/> : <p className="whitespace-pre-wrap text-sm">{result}</p>}
                </div>
            </div>
        </Card>
    );
};

const TABS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, component: ChatComponent },
    { id: 'image', label: 'Image Studio', icon: ImageIcon, component: ImageStudioComponent },
    { id: 'video', label: 'Video Studio', icon: Video, component: VideoStudioComponent },
    { id: 'audio', label: 'Audio Suite', icon: Mic, component: AudioSuiteComponent },
    { id: 'reasoning', label: 'Complex Query', icon: BrainCircuit, component: ComplexQueryComponent },
];

export const GeminiStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState('chat');
    
    const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gemini AI Studio</h2>
            
            <div className="flex space-x-2 border-b dark:border-gray-700">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                            activeTab === tab.id 
                            ? 'border-b-2 border-teal-500 text-teal-600' 
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {ActiveComponent && <ActiveComponent />}
        </div>
    );
};
