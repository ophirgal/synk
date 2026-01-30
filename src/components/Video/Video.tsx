import React from "react";
import { Camera, CameraOff, Mic, MicOff } from "lucide-react";


interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    withControls?: boolean,
    onTurnCameraOn?: () => void,
    onTurnCameraOff?: () => void,
    onTurnMicOn?: () => void,
    onTurnMicOff?: () => void
}

const avatarPlaceholderDataURI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMzAwJyB2aWV3Qm94PScwIDAgMjQgMjQnIGZpbGw9J25vbmUnIHN0cm9rZT0nZ3JheScgb3BhY2l0eT0nMC4zJyBzdHJva2Utd2lkdGg9JzEnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgY2xhc3M9J2x1Y2lkZSBsdWNpZGUtY2lyY2xlLXVzZXItcm91bmQtaWNvbiBsdWNpZGUtY2lyY2xlLXVzZXItcm91bmQnPjxwYXRoIGQ9J00xOCAyMGE2IDYgMCAwIDAtMTIgMCcvPjxjaXJjbGUgY3g9JzEyJyBjeT0nMTAnIHI9JzQnLz48Y2lyY2xlIGN4PScxMicgY3k9JzEyJyByPScxMCcvPjwvc3ZnPg=='

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

    const iconProps = {
        size: 50,
        strokeWidth: 2,
        className: "p-2 rounded cursor-pointer",
    }

    const nativeVideoProps = props as React.VideoHTMLAttributes<HTMLVideoElement>

    return <div className={`relative max-h-[100%] w-full rounded bg-black/5 dark:bg-white/5 bg-size-[100%] bg-[url('${avatarPlaceholderDataURI}')] ${props.hidden ? "hidden" : ""}`}>
        {props.withControls &&
            <div className="absolute bottom-2 left-2 flex w-full z-10">
                {isMicOn ? <Mic onClick={handleMicToggle} {...iconProps} /> : <MicOff onClick={handleMicToggle} {...iconProps} />}
                {isCameraOn ? <Camera onClick={handleCameraToggle} {...iconProps} /> : <CameraOff onClick={handleCameraToggle} {...iconProps} />}
            </div>
        }
        {/* <video className={`rounded object-cover h-full w-full ${shouldShowVideoFeed ? '' : 'opacity-0'}`} {...nativeVideoProps} /> */}
        <video className={`rounded object-cover h-full w-full`} {...nativeVideoProps} />
    </div>
};

export default Video
