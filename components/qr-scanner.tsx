"use client"

import { useState, useEffect } from "react"
import QrScanner from "react-qr-scanner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface QrScannerComponentProps {
  onScan: (data: string) => void
  onError?: (error: Error) => void
  onClose?: () => void
}

export function QrScannerComponent({ onScan, onError, onClose }: QrScannerComponentProps) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  
  // Request camera permissions and get available devices
  useEffect(() => {
    const getCameras = async () => {
      try {
        // First check/request permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop())
        
        setPermissionGranted(true)
        
        // Get the list of available video devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setCameras(videoDevices)
        
        // Select the first camera by default
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      } catch (error) {
        setPermissionGranted(false)
        console.error('Error accessing camera:', error)
        if (onError) onError(error as Error)
      }
    }
    
    getCameras()
  }, [onError])

  const handleScan = (data: { text: string } | null) => {
    if (data && data.text) {
      console.log("QR code detected:", data.text)
      onScan(data.text)
      setIsCameraActive(false)
    }
  }

  const handleError = (err: Error) => {
    console.error("QR Scanner error:", err)
    if (onError) onError(err)
  }

  const toggleCamera = () => {
    setIsCameraActive(prev => !prev)
  }

  return (
    <Card className="w-full border-border/50" suppressHydrationWarning>
      <div className="p-4 space-y-4">
        {/* Permission status */}
        {permissionGranted === false && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center" suppressHydrationWarning>
            <p className="text-sm text-red-500">
              Camera access denied. Please enable camera permissions in your browser settings.
            </p>
          </div>
        )}
        
        {/* Camera selection (if multiple cameras available) */}
        {cameras.length > 1 && (
          <div className="flex gap-2 flex-wrap" suppressHydrationWarning>
            {cameras.map(camera => (
              <Button
                key={camera.deviceId}
                variant={selectedCamera === camera.deviceId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCamera(camera.deviceId)}
                className="text-xs"
              >
                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
              </Button>
            ))}
          </div>
        )}
        
        {/* Scanner area */}
        <div className="relative" suppressHydrationWarning>
          {isCameraActive ? (
            <div className="w-full max-h-64 relative overflow-hidden rounded-lg">
              <QrScanner
                delay={100}
                onError={handleError}
                onScan={handleScan}
                constraints={{
                  video: { 
                    deviceId: selectedCamera || undefined,
                    facingMode: !selectedCamera ? 'environment' : undefined, // Use back camera by default
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '256px',
                  objectFit: 'cover'
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-primary/30 pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border/50">
              <div className="text-center p-4">
                <p className="text-muted-foreground font-medium mb-2">Camera is off</p>
                <p className="text-xs text-muted-foreground mb-4">Turn on camera to scan QR codes</p>
                <Button 
                  size="sm" 
                  onClick={toggleCamera}
                  disabled={permissionGranted === false}
                  className="bg-linear-to-r from-primary to-primary/90"
                >
                  Turn on camera
                </Button>
              </div>
            </div>
          )}
          
          {/* Camera control buttons */}
          {isCameraActive && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={toggleCamera}
                className="bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center" suppressHydrationWarning>
          <p className="text-xs text-muted-foreground">
            Position QR code within the frame to scan
          </p>
        </div>
      </div>
    </Card>
  )
}
