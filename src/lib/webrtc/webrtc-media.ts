import { LOCAL_VIDEO_ELEMENT_ID } from "@/constants/constants";
import { getRemoteVideoElementId, getRemoteAudioElementId } from "@/lib/utils";

type Connection = {
    peerConnection: RTCPeerConnection,
    remoteStream?: MediaStream;
    dataChannel?: RTCDataChannel;
}

let connections: {
    [key: string]: Connection
} = {};
let localStream: MediaStream | null = null;

const servers: RTCConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.1.google.com:19302',
                'stun:stun2.1.google.com:19302',
                'stun:stun3.1.google.com:19302',
                'stun:stun4.1.google.com:19302',
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
                'stun:124.64.206.224:8800',
                'stun:23.21.150.121:3478',
                'stun:iphone-stun.strato-iphone.de:3478',
                'stun:numb.viagenie.ca:3478',
                'stun:s1.taraba.net:3478',
                'stun:s1.voipstation.jp:3478',
                'stun:s2.taraba.net:3478',
                'stun:s2.voipstation.jp:3478',
                'stun:stun.12connect.com:3478',
                'stun:stun.12voip.com:3478',
                'stun:stun.1cbit.ru:3478',
                'stun:stun.1und1.de:3478',
                'stun:stun.2talk.co.nz:3478',
                'stun:stun.2talk.com:3478',
                'stun:stun.3clogic.com:3478',
                'stun:stun.3cx.com:3478',
                'stun:stun.3deluxe.de:3478',
                'stun:stun.3wayint.com:3478',
                'stun:stun.a-mm.tv:3478',
                'stun:stun.aa.net.uk:3478',
                'stun:stun.acrobits.cz:3478',
                'stun:stun.acronis.com:3478',
                'stun:stun.actionvoip.com:3478',
                'stun:stun.advfn.com:3478',
                'stun:stun.aeta-audio.com:3478',
                'stun:stun.aeta.com:3478',
                'stun:stun.allflac.com:3478',
                'stun:stun.alltel.com.au:3478',
                'stun:stun.alpirsbacher.de:3478',
                'stun:stun.altar.com.pl:3478',
                'stun:stun.annatel.net:3478',
                'stun:stun.antisip.com:3478',
                'stun:stun.arbuz.ru:3478',
                'stun:stun.atagverwarming.nl:3478',
                'stun:stun.avigora.com:3478',
                'stun:stun.avigora.fr:3478',
                'stun:stun.awa-shima.com:3478',
                'stun:stun.awt.be:3478',
                'stun:stun.axialys.net:3478',
                'stun:stun.b2b2c.ca:3478',
                'stun:stun.bahnhof.net:3478',
                'stun:stun.baltmannsweiler.de:3478',
                'stun:stun.barracuda.com:3478',
                'stun:stun.bethesda.net:3478',
                'stun:stun.bitburger.de:3478',
                'stun:stun.bluesip.net:3478',
                'stun:stun.bmwgs.cz:3478',
                'stun:stun.botonakis.com:3478',
                'stun:stun.bridesbay.com:3478',
                'stun:stun.budgetphone.nl:3478',
                'stun:stun.budgetsip.com:3478',
                'stun:stun.business-isp.nl:3478',
                'stun:stun.cablenet-as.net:3478',
                'stun:stun.callromania.ro:3478',
                'stun:stun.callwithus.com:3478',
                'stun:stun.cbsys.net:3478',
                'stun:stun.chathelp.ru:3478',
                'stun:stun.cheapvoip.com:3478',
                'stun:stun.ciktel.com:3478',
                'stun:stun.cloopen.com:3478',
                'stun:stun.colouredlines.com.au:3478',
                'stun:stun.comfi.com:3478',
                'stun:stun.commpeak.com:3478',
                'stun:stun.comtube.com:3478',
                'stun:stun.comtube.ru:3478',
                'stun:stun.cope.es:3478',
                'stun:stun.counterpath.com:3478',
                'stun:stun.counterpath.net:3478',
                'stun:stun.cryptonit.net:3478',
                'stun:stun.darioflaccovio.it:3478',
                'stun:stun.datamanagement.it:3478',
                'stun:stun.dcalling.de:3478',
                'stun:stun.decanet.fr:3478',
                'stun:stun.demos.ru:3478',
                'stun:stun.develz.org:3478',
                'stun:stun.diallog.com:3478',
                'stun:stun.dingaling.ca:3478',
                'stun:stun.doublerobotics.com:3478',
                'stun:stun.drogon.net:3478',
                'stun:stun.duocom.es:3478',
                'stun:stun.dus.net:3478',
                'stun:stun.e-fon.ch:3478',
                'stun:stun.easybell.de:3478',
                'stun:stun.easycall.pl:3478',
                'stun:stun.easyvoip.com:3478',
                'stun:stun.efficace-factory.com:3478',
                'stun:stun.einsundeins.com:3478',
                'stun:stun.einsundeins.de:3478',
                'stun:stun.ekiga.net:3478',
                'stun:stun.engineeredarts.co.uk:3478',
                'stun:stun.epygi.com:3478',
                'stun:stun.etoilediese.fr:3478',
                'stun:stun.eyeball.com:3478',
                'stun:stun.f.haeder.net:3478',
                'stun:stun.faktortel.com.au:3478',
                'stun:stun.files.fm:3478',
                'stun:stun.finsterwalder.com:3478',
                'stun:stun.fitauto.ru:3478',
                'stun:stun.flashdance.cx:3478',
                'stun:stun.fmo.de:3478',
                'stun:stun.freecall.com:3478',
                'stun:stun.freeswitch.org:3478',
                'stun:stun.freevoipdeal.com:3478',
                'stun:stun.frozenmountain.com:3478',
                'stun:stun.fuzemeeting.com:3478',
                'stun:stun.fwdnet.net:3478',
                'stun:stun.geesthacht.de:3478',
                'stun:stun.genymotion.com:3478',
                'stun:stun.gmx.de:3478',
                'stun:stun.gmx.net:3478',
                'stun:stun.godatenow.com:3478',
                'stun:stun.gradwell.com:3478',
                'stun:stun.graftlab.com:3478',
                'stun:stun.halonet.pl:3478',
                'stun:stun.healthtap.com:3478',
                'stun:stun.heeds.eu:3478',
                'stun:stun.hellonanu.com:3478',
                'stun:stun.hoiio.com:3478',
                'stun:stun.hosteurope.de:3478',
                'stun:stun.hot-chilli.net:3478',
                'stun:stun.ideasip.com:3478',
                'stun:stun.imesh.com:3478',
                'stun:stun.imp.ch:3478',
                'stun:stun.infra.net:3478',
                'stun:stun.internetcalls.com:3478',
                'stun:stun.intervoip.com:3478',
                'stun:stun.ipcomms.net:3478',
                'stun:stun.ipfire.org:3478',
                'stun:stun.ippi.fr:3478',
                'stun:stun.ipshka.com:3478',
                'stun:stun.iptel.org:3478',
                'stun:stun.irian.at:3478',
                'stun:stun.it1.hr:3478',
                'stun:stun.ivao.aero:3478',
                'stun:stun.jappix.com:3478',
                'stun:stun.jumblo.com:3478',
                'stun:stun.justvoip.com:3478',
                'stun:stun.kanet.ru:3478',
                'stun:stun.kanojo.de:3478',
                'stun:stun.kaseya.com:3478',
                'stun:stun.kiwilink.co.nz:3478',
                'stun:stun.kundenserver.de:3478',
                'stun:stun.linea7.net:3478',
                'stun:stun.linphone.org:3478',
                'stun:stun.linuxtrent.it:3478',
                'stun:stun.liveo.fr:3478',
                'stun:stun.lleida.net:3478',
                'stun:stun.lovense.com:3478',
                'stun:stun.lowratevoip.com:3478',
                'stun:stun.lugosoft.com:3478',
                'stun:stun.lundimatin.fr:3478',
                'stun:stun.m-online.net:3478',
                'stun:stun.magnet.ie:3478',
                'stun:stun.manle.com:3478',
                'stun:stun.meetwife.com:3478',
                'stun:stun.mgn.ru:3478',
                'stun:stun.mit.de:3478',
                'stun:stun.mitake.com.tw:3478',
                'stun:stun.miwifi.com:3478',
                'stun:stun.mixvoip.com:3478',
                'stun:stun.modulus.gr:3478',
                'stun:stun.moonlight-stream.org:3478',
                'stun:stun.mozcom.com:3478',
                'stun:stun.myspeciality.com:3478',
                'stun:stun.myvoiptraffic.com:3478',
                'stun:stun.mywatson.it:3478',
                'stun:stun.nanocosmos.de:3478',
                'stun:stun.nas.net:3478',
                'stun:stun.ncic.com:3478',
                'stun:stun.neotel.co.za:3478',
                'stun:stun.netappel.com:3478',
                'stun:stun.netappel.fr:3478',
                'stun:stun.netgsm.com.tr:3478',
                'stun:stun.nextcloud.com:3478',
                'stun:stun.nextcloud.com:443',
                'stun:stun.nfon.net:3478',
                'stun:stun.noblogs.org:3478',
                'stun:stun.noc.ams-ix.net:3478',
                'stun:stun.node4.co.uk:3478',
                'stun:stun.nonoh.net:3478',
                'stun:stun.nottingham.ac.uk:3478',
                'stun:stun.nova.is:3478',
                'stun:stun.nventure.com:3478',
                'stun:stun.on.net.mk:3478',
                'stun:stun.oncloud7.ch:3478',
                'stun:stun.ooma.com:3478',
                'stun:stun.ooonet.ru:3478',
                'stun:stun.oriontelekom.rs:3478',
                'stun:stun.outland-net.de:3478',
                'stun:stun.ozekiphone.com:3478',
                'stun:stun.patlive.com:3478',
                'stun:stun.peethultra.be:3478',
                'stun:stun.personal-voip.de:3478',
                'stun:stun.petcube.com:3478',
                'stun:stun.phone.com:3478',
                'stun:stun.phoneserve.com:3478',
                'stun:stun.pjsip.org:3478',
                'stun:stun.poetamatusel.org:3478',
                'stun:stun.poivy.com:3478',
                'stun:stun.powerpbx.org:3478',
                'stun:stun.powervoip.com:3478',
                'stun:stun.ppdi.com:3478',
                'stun:stun.prizee.com:3478',
                'stun:stun.pure-ip.com:3478',
                'stun:stun.qq.com:3478',
                'stun:stun.qvod.com:3478',
                'stun:stun.rackco.com:3478',
                'stun:stun.radiojar.com:3478',
                'stun:stun.rapidnet.de:3478',
                'stun:stun.rb-net.com:3478',
                'stun:stun.refint.net:3478',
                'stun:stun.remote-learner.net:3478',
                'stun:stun.ringostat.com:3478',
                'stun:stun.rixtelecom.se:3478',
                'stun:stun.rockenstein.de:3478',
                'stun:stun.rolmail.net:3478',
                'stun:stun.romaaeterna.nl:3478',
                'stun:stun.romancecompass.com:3478',
                'stun:stun.root-1.de:3478',
                'stun:stun.rounds.com:3478',
                'stun:stun.ru-brides.com:3478',
                'stun:stun.rynga.com:3478',
                'stun:stun.samsungsmartcam.com:3478',
                'stun:stun.schlund.de:3478',
                'stun:stun.services.mozilla.com:3478',
                'stun:stun.sigmavoip.com:3478',
                'stun:stun.signalwire.com:3478',
                'stun:stun.sip.us:3478',
                'stun:stun.sipdiscount.com:3478',
                'stun:stun.siplogin.de:3478',
                'stun:stun.sipnet.com:3478',
                'stun:stun.sipnet.net:3478',
                'stun:stun.sipnet.ru:3478',
                'stun:stun.siportal.it:3478',
                'stun:stun.sippeer.dk:3478',
                'stun:stun.sipthor.net:3478',
                'stun:stun.siptraffic.com:3478',
                'stun:stun.siptrunk.com:3478',
                'stun:stun.sipus:3478',
                'stun:stun.skydrone.aero:3478',
                'stun:stun.skylink.ru:3478',
                'stun:stun.sma.de:3478',
                'stun:stun.smartvoip.com:3478',
                'stun:stun.smsdiscount.com:3478',
                'stun:stun.snafu.de:3478',
                'stun:stun.softjoys.com:3478',
                'stun:stun.solcon.nl:3478',
                'stun:stun.solnet.ch:3478',
                'stun:stun.sonetel.com:3478',
                'stun:stun.sonetel.net:3478',
                'stun:stun.sovtest.ru:3478',
                'stun:stun.speedy.com.ar:3478',
                'stun:stun.spokn.com:3478',
                'stun:stun.spreed.me:3478',
                'stun:stun.srce.hr:3478',
                'stun:stun.ssl7.net:3478',
                'stun:stun.stochastix.de:3478',
                'stun:stun.streamnow.ch:3478',
                'stun:stun.stunprotocol.org:3478',
                'stun:stun.stunprotocol.prg:3478',
                'stun:stun.symform.com:3478',
                'stun:stun.symplicity.com:3478',
                'stun:stun.sysadminman.net:3478',
                'stun:stun.t-online.de:3478',
                'stun:stun.tagan.ru:3478',
                'stun:stun.tatneft.ru:3478',
                'stun:stun.teachercreated.com:3478',
                'stun:stun.technosens.fr:3478',
                'stun:stun.tel.lu:3478',
                'stun:stun.telbo.com:3478',
                'stun:stun.telefacil.com:3478',
                'stun:stun.telnyx.com:3478',
                'stun:stun.thinkrosystem.com:3478',
                'stun:stun.threema.ch:3478',
                'stun:stun.tis-dialog.ru:3478',
                'stun:stun.tng.de:3478',
                'stun:stun.ttmath.org:3478',
                'stun:stun.twt.it:3478',
                'stun:stun.u-blox.com:3478',
                'stun:stun.uabrides.com:3478',
                'stun:stun.ucallweconn.net:3478',
                'stun:stun.ucsb.edu:3478',
                'stun:stun.ucw.cz:3478',
                'stun:stun.ukh.de:3478',
                'stun:stun.uls.co.za:3478',
                'stun:stun.unseen.is:3478',
                'stun:stun.usfamily.net:3478',
                'stun:stun.valorant.com:3478',
                'stun:stun.vavadating.com:3478',
                'stun:stun.veoh.com:3478',
                'stun:stun.verbo.be:3478',
                'stun:stun.vidyo.com:3478',
                'stun:stun.vipgroup.net:3478',
                'stun:stun.virtual-call.com:3478',
                'stun:stun.viva.gr:3478',
                'stun:stun.vivox.com:3478',
                'stun:stun.vline.com:3478',
                'stun:stun.vo.lu:3478',
                'stun:stun.vodafone.ro:3478',
                'stun:stun.voicetrading.com:3478',
                'stun:stun.voip.aebc.com:3478',
                'stun:stun.voip.blackberry.com:3478',
                'stun:stun.voip.eutelia.it:3478',
                'stun:stun.voiparound.com:3478',
                'stun:stun.voipblast.com:3478',
                'stun:stun.voipbuster.com:3478',
                'stun:stun.voipbusterpro.com:3478',
                'stun:stun.voipcheap.co.uk:3478',
                'stun:stun.voipcheap.com:3478',
                'stun:stun.voipfibre.com:3478',
                'stun:stun.voipgain.com:3478',
                'stun:stun.voipgate.com:3478',
                'stun:stun.voipia.net:3478',
                'stun:stun.voipinfocenter.com:3478',
                'stun:stun.voipplanet.nl:3478',
                'stun:stun.voippro.com:3478',
                'stun:stun.voipraider.com:3478',
                'stun:stun.voipstunt.com:3478',
                'stun:stun.voiptia.net:3478',
                'stun:stun.voipwise.com:3478',
                'stun:stun.voipzoom.com:3478',
                'stun:stun.vopium.com:3478',
                'stun:stun.voxgratia.org:3478',
                'stun:stun.voxox.com:3478',
                'stun:stun.voys.nl:3478',
                'stun:stun.voztele.com:3478',
                'stun:stun.voztovoice.org:3478',
                'stun:stun.vyke.com:3478',
                'stun:stun.webcalldirect.com:3478',
                'stun:stun.whoi.edu:3478',
                'stun:stun.wifirst.net:3478',
                'stun:stun.wwdl.net:3478',
                'stun:stun.xs4all.nl:3478',
                'stun:stun.xten.com:3478',
                'stun:stun.xtratelecom.es:3478',
                'stun:stun.yesdates.com:3478',
                'stun:stun.yesss.at:3478',
                'stun:stun.zadarma.com:3478',
                'stun:stun.zadv.com:3478',
                'stun:stun.zentauron.de:3478',
                'stun:stun.zepter.ru:3478',
                'stun:stun.zoiper.com:3478',
                'stun:stun01.sipphone.com:3478',
                'stun:stun1.faktortel.com.au:3478',
                'stun:stun1.voiceeclipse.net:3478',
                'stun:stunserver.org:3478'
            ]
        },
        {
            urls: [
                'turn:free.expressturn.com:3478'
            ],
            username: import.meta.env.VITE_FREE_EXPRESS_TURN_SERVER_USERNAME,
            credential: import.meta.env.VITE_FREE_EXPRESS_TURN_SERVER_CREDENTIAL,
        }
    ]
};

const RTCPeerConnectionState = {
    CLOSED: "closed",
    CONNECTED: "connected",
    CONNECTING: "connecting",
    DISCONNECTED: "disconnected",
    FAILED: "failed",
    NEW: "new",
} as const;

/**
 * Ensures a local media stream is available and updates its enabled media types as specified.
 * If the local stream does not exist, it is initialized with at least one enabled media type.
 * The local video element is updated with the local stream if the camera is enabled.
 * @param {boolean} cameraOn - Whether the video track should be enabled.
 * @param {boolean} microphoneOn - Whether the audio track should be enabled.
 * @returns {Promise<void>} - A promise that resolves when the local stream has been updated.
 */
const ensureLocalStream = async (cameraOn: boolean = false, microphoneOn: boolean = false): Promise<void> => {
    // if (!localStream) {
    if (true) {
        // need at least one enabled media type for initialization
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        // turning media types on/off as specified
        localStream.getAudioTracks().forEach(track => track.enabled = microphoneOn)
        localStream.getVideoTracks().forEach(track => track.enabled = cameraOn)
    }
    const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement
    if (localVideo && cameraOn) localVideo.srcObject = localStream
};

/**
 * Ensures a remote media stream is available.
 * If the remote stream does not exist, it is initialized.
 */
const ensureRemoteStream = (connectionId: string) => {
    connections[connectionId] = connections[connectionId] || {}
    const conn = connections[connectionId]
    if (!conn.remoteStream) conn.remoteStream = new MediaStream()
};

const toggleLocalCamera = async (cameraOn: boolean = true): Promise<void> => {
    if (cameraOn && !localStream) {
        // alert("ensuring localStream exists with camera on")
        await ensureLocalStream(true);
        return;
    }
    // enable/disable video track (stops sending frames when disabled)
    localStream?.getVideoTracks().forEach(track => {
        track.enabled = cameraOn;
    });
    // inflate or nullify video source (nullifying displays poster)
    const localVideo = document.getElementById(LOCAL_VIDEO_ELEMENT_ID) as HTMLVideoElement
    if (!localVideo) return;
    localVideo.srcObject = cameraOn ? localStream : null
};

const toggleLocalMic = async (microphoneOn: boolean = true): Promise<void> => {
    if (microphoneOn && !localStream) {
        await ensureLocalStream(false, true);
        return;
    }
    localStream?.getAudioTracks().forEach(track => {
        track.enabled = microphoneOn;
    });
};

const toggleRemoteVideoAndAudioSources = (connectionId: string, isVideoSrc: boolean = true, isMicSrc: boolean = true): void => {
    ensureRemoteStream(connectionId);
    let remoteStream = connections[connectionId].remoteStream!

    // inflate or nullify video source so as to display poster when needed
    const remoteVideoEl = document.getElementById(getRemoteVideoElementId(connectionId)) as HTMLVideoElement
    if (!remoteVideoEl) return;
    remoteVideoEl.srcObject = isVideoSrc ? remoteStream : null

    // nullify or inflate audio source (keeps remote audio playing when video is disabled)
    // -- only inflate audio source when video source is nullified
    const remoteAudioEl = getOrCreateAudioElement(connectionId)
    remoteAudioEl.srcObject = (isMicSrc && !remoteVideoEl.srcObject) ? remoteStream : null
}

// Ensures hidden audio element exists; 
// serves as fallback player for remote audio when nullifying video element's stream.
function getOrCreateAudioElement(connectionId: string): HTMLAudioElement {
    const remoteAudioElementId = getRemoteAudioElementId(connectionId)
    let remoteAudioEl = document.getElementById(remoteAudioElementId) as HTMLAudioElement
    if (!remoteAudioEl) {
        remoteAudioEl = document.createElement('audio');
        remoteAudioEl.id = remoteAudioElementId;
        remoteAudioEl.style.display = 'none';
        remoteAudioEl.autoplay = true;
        document.body.appendChild(remoteAudioEl);
    }
    return remoteAudioEl;
}

const createOfferForConnection = async (
    connectionId: string,
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    onConnectionConnected: () => void,
    onDataChannelReady: (channel: RTCDataChannel) => void
): Promise<RTCSessionDescriptionInit> => {
    const conn: Connection = { peerConnection: new RTCPeerConnection(servers) };
    connections[connectionId] = conn;

    // Create data channel BEFORE creating offer (creator side)
    conn.dataChannel = conn.peerConnection.createDataChannel('yjs-sync', {
        ordered: true,
    });

    conn.dataChannel.onopen = () => {
        // handle data channel opened (creator side);
        onDataChannelReady(conn.dataChannel!);
    };

    localStream?.getTracks().forEach(track => {
        conn.peerConnection.addTrack(track, localStream!);
    });

    conn.peerConnection.ontrack = (event: RTCTrackEvent) => {
        toggleRemoteVideoAndAudioSources(connectionId);

        event.streams.forEach(stream => {
            stream.getTracks().forEach(track => {
                connections[connectionId].remoteStream?.addTrack(track);
            });
        });
    };

    conn.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            onIceCandidate(event.candidate.toJSON());
        }
    };

    conn.peerConnection.onconnectionstatechange = () => {
        if (conn.peerConnection.connectionState === RTCPeerConnectionState.CONNECTED) {
            onConnectionConnected();
        }
        if (conn.peerConnection.connectionState === RTCPeerConnectionState.FAILED) {
            delete connections[connectionId];
        }
    }

    const offer = await conn.peerConnection.createOffer();
    await conn.peerConnection.setLocalDescription(offer);

    return offer;
};

const createAnswerForConnection = async (
    connectionId: string,
    offer: RTCSessionDescriptionInit,
    onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    onConnectionConnected: () => void,
    onDataChannelReady: (channel: RTCDataChannel) => void
): Promise<RTCSessionDescriptionInit> => {
    if (connections[connectionId]?.peerConnection) { // connection was created, return local description as answer
        return connections[connectionId].peerConnection.localDescription!;
    }
    const conn: Connection = { peerConnection: new RTCPeerConnection(servers) };
    connections[connectionId] = conn;

    // Listen for data channel from creator (joiner side)
    conn.peerConnection.ondatachannel = (event) => {
        conn.dataChannel = event.channel;
        // console.log('[DEBUG]: WebRTC data channel received (joiner)');

        conn.dataChannel.onopen = () => {
            // handle data channel opened (joiner side);
            onDataChannelReady(connections[connectionId].dataChannel!);
        };
    };

    localStream?.getTracks().forEach(track => {
        conn.peerConnection.addTrack(track, localStream!);
    });

    ensureRemoteStream(connectionId);

    conn.peerConnection.ontrack = (event: RTCTrackEvent) => {
        event.streams[0].getTracks().forEach(track => {
            connections[connectionId].remoteStream!.addTrack(track);
        });
    };

    conn.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
            onIceCandidate(event.candidate.toJSON());
        }
    };

    conn.peerConnection.onconnectionstatechange = () => {
        if (conn.peerConnection.connectionState === RTCPeerConnectionState.CONNECTED) {
            onConnectionConnected();
        }
        if (conn.peerConnection.connectionState === RTCPeerConnectionState.FAILED) {
            delete connections[connectionId];
        }
    }

    await conn.peerConnection.setRemoteDescription(offer);

    const answer = await conn.peerConnection.createAnswer();
    await conn.peerConnection.setLocalDescription(answer);

    return answer;
};

const isRemoteDescriptionSet = (connectionId: string): boolean => {
    return !!connections[connectionId]?.peerConnection.currentRemoteDescription;
};


const setRemoteAnswer = async (connectionId: string, answer: RTCSessionDescriptionInit): Promise<void> => {
    const conn = connections[connectionId];
    if (conn && conn.peerConnection && !conn.peerConnection.currentRemoteDescription) {
        await conn.peerConnection.setRemoteDescription(answer);
    }
};

const addRemoteIceCandidate = async (connectionId: string, candidate: RTCIceCandidateInit): Promise<void> => {
    const conn = connections[connectionId];
    if (conn && conn.peerConnection) {
        await conn.peerConnection.addIceCandidate(candidate);
    }
};

const getConnections = () => connections;

export {
    ensureLocalStream,
    ensureRemoteStream,
    toggleLocalCamera,
    toggleLocalMic,
    toggleRemoteVideoAndAudioSources,
    createOfferForConnection,
    createAnswerForConnection,
    isRemoteDescriptionSet,
    setRemoteAnswer,
    addRemoteIceCandidate,
    getConnections,
};