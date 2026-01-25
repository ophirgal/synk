export default function Home() {
    return (
        <>
            <div className="flex items-center justify-center h-full">
                <div className="max-w-4xl mx-auto px-8 py-16 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Code Together, Face to Face
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 mb-16 leading-relaxed">
                        Experience the future of collaborative coding with <span className="font-semibold text-indigo-600">[synk]</span>.
                    </p>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        The revolutionary platform that combines real-time code collaboration with live video and audio.
                        Have seamless 1-on-1 experiences, see changes instantly, and communicate naturally—all in one place.
                        No more switching between tools.
                        <br />
                        Just pure, <span className="font-semibold text-indigo-600">[synk]</span>hronized productivity.
                    </p>
                    <a
                        href="/rooms"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                        Try Now!
                    </a>
                </div>
            </div>
        </>
    )
}
