import React from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";

import type { Profile } from "@/lib/collaboration";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    withControls?: boolean,
    remoteProfile?: Profile,
    onTurnCameraOn?: () => void,
    onTurnCameraOff?: () => void,
    onTurnMicOn?: () => void,
    onTurnMicOff?: () => void
}

const Video: React.FC<VideoProps> = (props) => {
    const [isCameraOn, setIsCameraOn] = React.useState(false);
    const [isMicOn, setIsMicOn] = React.useState(false);

    const handleMicToggle = () => {
        isMicOn ? props.onTurnMicOff?.() : props.onTurnMicOn?.()
        setIsMicOn(!isMicOn);
    }
    const handleCameraToggle = () => {
        isCameraOn ? props.onTurnCameraOff?.() : props.onTurnCameraOn?.()
        setIsCameraOn(!isCameraOn);
    }

    const localIconProps = {
        size: 50,
        strokeWidth: 2,
        className: "p-2 rounded cursor-pointer",
    }

    const remoteIconProps = {
        size: 50,
        strokeWidth: 2,
        className: "p-2 rounded select-none text-border",
    }

    const nativeVideoProps = props as React.VideoHTMLAttributes<HTMLVideoElement>

    return <div className={`relative max-h-[100%] w-full rounded bg-black/5 dark:bg-white/5 ${props.hidden ? "hidden" : ""}`}>
        {props.withControls &&
            <div className="absolute bottom-2 left-2 flex w-full z-10">
                {isMicOn ? <Mic onClick={handleMicToggle} {...localIconProps} /> : <MicOff onClick={handleMicToggle} {...localIconProps} />}
                {isCameraOn ? <Camera onClick={handleCameraToggle} {...localIconProps} /> : <CameraOff onClick={handleCameraToggle} {...localIconProps} />}
            </div>
        }
        {props.remoteProfile &&
            <div className="absolute bottom-2 left-2 flex w-full z-10">
                {props.remoteProfile.microphoneOn ? <Mic {...remoteIconProps} /> : <MicOff {...remoteIconProps} />}
                {props.remoteProfile.cameraOn ? <Camera {...remoteIconProps} /> : <CameraOff {...remoteIconProps} />}
            </div>
        }
        <video className={`rounded object-cover h-full w-full`} {...nativeVideoProps} />
    </div>
};

export default Video
