import React from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";

import { type Profile } from "@/lib/webrtc";
import { ReactAnimal, type ReactAnimalNames } from "@/components/ReactAnimal";
// import { Spinner } from "@/components/ui/spinner";
// import { RTCPeerConnectionState } from "@/lib/webrtc";

interface LivestreamPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    withControls?: boolean,
    profile: Profile,
    isLocalProfile?: boolean,
    onCameraToggle?: () => void,
    onMicToggle?: () => void,
    hidden?: boolean
    connectionState?: RTCPeerConnectionState
}

const LivestreamPlayer: React.FC<LivestreamPlayerProps> = (props) => {
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

    const avatarAnimal = props.profile.displayName.split(' ')[1] as ReactAnimalNames

    return <div className={`relative max-h-[100%] w-full rounded bg-black/5 dark:bg-white/5 ${props.hidden ? "hidden" : ""}`}>
        {/* {(props.connectionState && props.connectionState !== RTCPeerConnectionState.CONNECTED) ?
            <><Spinner data-icon="inline-start" className="mr-1" /> Connecting...</>
            : */}
        <>
            <video className={`rounded object-cover h-full w-full`} {...nativeVideoProps} />
            {props.isLocalProfile ?
                LocalProfileStatusBar(avatarAnimal, props, localIconProps)
                :
                RemoteProfileStatusBar(avatarAnimal, props, remoteIconProps)
            }
        </>
        {/* } */}
    </div>
};


function RemoteProfileStatusBar(avatarAnimal: ReactAnimalNames, props: LivestreamPlayerProps, remoteIconProps: { size: number; strokeWidth: number; className: string; }): React.ReactNode {
    return <div className="absolute bottom-0 flex w-full px-4 z-10 bg-gray-500/50 rounded-b">
        <div className="flex items-center justify-start gap-3 truncate text-gray-300">
            <span className="scale-90"><ReactAnimal name={avatarAnimal} size="sm" shape="circle" color="indigo" /></span>
            <p className="text-xl truncate whitespace-nowrap max-w-50">{props.profile.displayName}</p>
        </div>
        {props.withControls &&
            <div className="flex-1 flex justify-end">
                {props.profile.isMicrophoneOn ? <Mic {...remoteIconProps} /> : <MicOff {...remoteIconProps} />}
                {props.profile.isCameraOn ? <Camera {...remoteIconProps} /> : <CameraOff {...remoteIconProps} />}
            </div>}
    </div>;
}

function LocalProfileStatusBar(avatarAnimal: ReactAnimalNames, props: LivestreamPlayerProps, localIconProps: { size: number; strokeWidth: number; className: string; }): React.ReactNode {
    return <div className="absolute bottom-0 flex w-full px-4 z-10 dark:bg-black/25 bg-white/25 rounded-b">
        <div className="flex items-center justify-start gap-3 truncate">
            <span className="scale-90"><ReactAnimal name={avatarAnimal} size="sm" shape="circle" color="indigo" /></span>
            <p className="text-xl truncate whitespace-nowrap max-w-50">{props.profile.displayName}</p>
        </div>
        {props.withControls &&
            <div className="flex-1 flex justify-end">
                {props.profile.isMicrophoneOn ? <Mic onClick={props.onMicToggle} {...localIconProps} /> : <MicOff onClick={props.onMicToggle} {...localIconProps} />}
                {props.profile.isCameraOn ? <Camera onClick={props.onCameraToggle} {...localIconProps} /> : <CameraOff onClick={props.onCameraToggle} {...localIconProps} />}
            </div>}
    </div>;
}


export default LivestreamPlayer