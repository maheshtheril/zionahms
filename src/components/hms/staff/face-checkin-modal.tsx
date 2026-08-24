"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, Loader2, Sparkles, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { verifyFaceAndPunchIn } from '@/app/actions/face-attendance';

export function FaceCheckinModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setIsCapturing(true);
            setCapturedImage(null);
            setSuccessMessage(null);
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
        } catch (e: any) {
            console.error("Camera access error", e);
            toast.error("Camera Error", { description: "Please allow camera permissions for Face ID check-in." });
        } finally {
            setIsCapturing(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };

    const captureSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth || 640;
                canvasRef.current.height = videoRef.current.videoHeight || 480;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleVerify = async () => {
        if (!capturedImage) return;

        setIsVerifying(true);
        try {
            // Get current geolocation if available
            let lat: number | undefined;
            let lng: number | undefined;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        lat = pos.coords.latitude;
                        lng = pos.coords.longitude;
                    },
                    () => {}
                );
            }

            const res = await verifyFaceAndPunchIn({
                imageBase64: capturedImage,
                punchData: { lat, lng }
            });

            if (res.error) {
                toast.error("Punch-In Error", { description: res.error });
            } else {
                setSuccessMessage(res.message || "Attendance recorded successfully!");
                toast.success("AI Face Check-In Complete", { description: `Welcome ${res.staffName || 'Staff'}!` });
            }
        } catch (e: any) {
            toast.error("Verification Error", { description: e.message });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg"
                >
                    <UserCheck className="h-4 w-4" />
                    AI Face Check-In
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-border shadow-2xl rounded-2xl space-y-4 p-6 text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            <span>AI Face ID Attendance Kiosk</span>
                        </div>
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                            BIOMETRIC AI
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                {/* Camera Viewport */}
                <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500/30 flex items-center justify-center shadow-inner">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {/* Live Face Overlay Ring */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 rounded-full border-4 border-dashed border-indigo-400/70 animate-spin-slow flex items-center justify-center">
                                    <div className="w-44 h-44 rounded-full border-2 border-indigo-500/40" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Status Message */}
                {successMessage ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                ) : (
                    <p className="text-xs text-center text-muted-foreground">
                        {!capturedImage ? "Position your face inside the circle and click Capture." : "Review snapshot and click Confirm Punch-In."}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    {capturedImage ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={startCamera}
                                disabled={isVerifying}
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-1.5" /> Retake
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={isVerifying || !!successMessage}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                                Confirm Punch-In
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={captureSnapshot}
                            disabled={isCapturing}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2"
                        >
                            <Camera className="h-4 w-4" />
                            Capture Face Snapshot
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
