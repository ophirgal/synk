import React from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";

import type { Profile } from "@/lib/webrtc";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    withControls?: boolean,
    profile: Profile,
    isLocalProfile?: boolean,
    onCameraToggle?: () => void,
    onMicToggle?: () => void,
}

const Video: React.FC<VideoProps> = (props) => {
    const localIconProps = {
        size: 50,
        strokeWidth: 1,
        className: "pl-4 rounded cursor-pointer",
    }

    const remoteIconProps = {
        size: 50,
        strokeWidth: 1,
        className: "pl-4 rounded select-none text-gray-300",
    }

    const nativeVideoProps = props as React.VideoHTMLAttributes<HTMLVideoElement>

    return <div className={`relative max-h-[100%] w-full rounded bg-black/5 dark:bg-white/5 ${props.hidden ? "hidden" : ""}`}>
        {props.isLocalProfile ?
            <div className="absolute bottom-0 flex w-full px-4 z-10 dark:bg-black/25 bg-white/25 rounded-b">
                <div className="flex-1 w-full flex items-center justify-start">
                    <p className="text-xl truncate whitespace-nowrap max-w-50">{props.profile.username}</p>
                </div>
                {props.withControls &&
                    <>
                        {props.profile.isMicrophoneOn ? <Mic onClick={props.onMicToggle} {...localIconProps} /> : <MicOff onClick={props.onMicToggle} {...localIconProps} />}
                        {props.profile.isCameraOn ? <Camera onClick={props.onCameraToggle} {...localIconProps} /> : <CameraOff onClick={props.onCameraToggle} {...localIconProps} />}
                    </>
                }
            </div>
            :
            <div className="absolute bottom-0 flex w-full px-4 z-10 bg-gray-500/50 rounded-b">
                <div className="flex-1 w-full flex items-center justify-start text-gray-300">
                    <p className="text-xl truncate whitespace-nowrap max-w-50">{props.profile.username}</p>
                </div>
                {props.withControls &&
                    <>
                        {props.profile.isMicrophoneOn ? <Mic {...remoteIconProps} /> : <MicOff {...remoteIconProps} />}
                        {props.profile.isCameraOn ? <Camera {...remoteIconProps} /> : <CameraOff {...remoteIconProps} />}
                    </>
                }
            </div>
        }
        <video className={`rounded object-cover h-full w-full`} {...nativeVideoProps} />
    </div>
};

export default Video
