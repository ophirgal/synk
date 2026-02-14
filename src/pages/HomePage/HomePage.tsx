import { useEffect } from "react"
import { useLocation } from "react-router"
import { Check, Mail } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const demoVideo = "/assets/videos/demo_video.webm"
const demoImage = "/assets/demo_image.png"

const pricingTiers = [
    {
        name: "Free",
        price: "$0",
        description: "Get started with real-time collaboration",
        features: [
            "Code editor with syntax highlighting",
            "Live video & audio",
            "Shared text editor",
            "Shared code execution",
            "Room creation via link",
        ],
        cta: "[synk] Up!",
        ctaHref: "/rooms",
        highlighted: true,
    },
    {
        name: "Pro",
        price: "$19",
        period: "/mo",
        description: "For developers who want more",
        features: [
            "Everything in Free",
            "Unlimited session duration",
            "10+ programming languages",
            "Session recording & playback",
            "Priority support",
        ],
        cta: "Coming Soon",
        ctaHref: "#",
        highlighted: false,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For teams and organizations",
        features: [
            "Everything in Pro",
            "Team rooms & workspaces",
            "Admin dashboard & controls",
            "SSO & advanced security",
            "Dedicated support",
        ],
        cta: "Contact Us",
        ctaHref: "#contact",
        highlighted: false,
    },
]

const faqItems = [
    {
        question: "What is [synk]?",
        answer: "[synk] is a real-time collaborative coding platform that combines a code editor, shared text editor, and live video conferencing — all in your browser. No downloads, no accounts required. You can use it for teaching, work, interviews, or anything else you dream of!",
    },
    {
        question: "Do I need to create an account?",
        answer: "No. [synk] is designed for zero-friction collaboration. Just create a room and share the link with your partner. No signup, no login.",
    },
    {
        question: "How do I use this?",
        answer: "You simply create a room ([synk] up!) and share the link with your partner. Once they join, they'll see the code editor, video/audio, and text editor. You can type and run code in real-time.",
    },
    {
        question: "How many people can join a room?",
        answer: "Our free tier supports up to 2 participants for 1-on-1 collaboration. We're working on Pro and Enterprise tiers with additional features.",
    },
    {
        question: "Is [synk] free to use?",
        answer: "Yes! The core experience — code editor, video/audio, and text editor — is completely free. We're working on Pro and Enterprise tiers with additional features.",
    },
    {
        question: "Is my code secure?",
        answer: "Your code is transmitted using peer-to-peer connections, meaning it goes directly between you and your collaborator without passing through our servers. Room data is ephemeral and not stored after the session ends.",
    },
    {
        question: "What programming languages are supported?",
        answer: "[synk] currently supports Python and JavaScript, with more languages coming soon.",
    },
]

export default function HomePage() {
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const el = document.getElementById(location.hash.slice(1))
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100)
            }
        }
    }, [location.hash])

    return (
        <>
            <HeroSection />
            <PricingSection />
            <FAQSection />
            <ContactSection />
        </>
    )
}

function HeroSection() {
    return <section className="flex items-center justify-center min-h-[calc(100vh-140px)] 2xl:px-25">
        <div className="flex-1 max-w-4xl mx-auto p-8 sm:py-16 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 dark:text-gray-100">
                Experience the future of collaborative coding.
            </h1>
            <p className="text-3xl sm:text-xl md:text-2xl text-gray-700 dark:text-gray-100 mb-6 sm:mb-8 leading-relaxed">
                No Signup. No Friction.<br />
                Just Pure Productivity.
            </p>
            <p className="hidden lg:block text-xl sm:text-lg text-gray-600 dark:text-gray-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-20">
                The revolutionary platform that combines real-time code collaboration with live video and audio.
                Have seamless 1-on-1 experiences, see changes instantly, and communicate naturally—all in one place.
                No more switching between tools.
                <br />
                Just pure, <span className="font-semibold text-indigo-500 dark:text-indigo-400">[synk]</span>hronized productivity.
            </p>
            <img src={demoImage} className="block lg:hidden w-full mb-6" />
            <a
                href="/rooms"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
                [synk] Up!
            </a>
        </div>
        <video src={demoVideo} className="hidden lg:block flex-1 w-100 scale-150 md:pr-25 md:pl-5" autoPlay loop muted playsInline />
    </section>

}

function PricingSection() {
    return <section id="pricing" className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
                Pricing
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
                Start collaborating for free. Upgrade when you need more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {pricingTiers.map((tier) => (
                    <div
                        key={tier.name}
                        className={`rounded-xl p-6 sm:p-8 flex flex-col ${tier.highlighted
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-500 shadow-xl scale-[1.02]"
                            : "bg-white/60 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10"
                            }`}
                    >
                        <h3 className={`text-xl font-semibold mb-2 ${tier.highlighted ? "text-white" : "text-gray-900 dark:text-gray-100"
                            }`}>
                            {tier.name}
                        </h3>
                        <div className="mb-4">
                            <span className={`text-4xl font-bold ${tier.highlighted ? "text-white" : "text-gray-900 dark:text-gray-100"
                                }`}>
                                {tier.price}
                            </span>
                            {tier.period && (
                                <span className={tier.highlighted ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}>
                                    {tier.period}
                                </span>
                            )}
                        </div>
                        <p className={`mb-6 ${tier.highlighted ? "text-indigo-100" : "text-gray-600 dark:text-gray-400"
                            }`}>
                            {tier.description}
                        </p>
                        <ul className="space-y-3 mb-8 flex-1">
                            {tier.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2">
                                    <Check className={`h-5 w-5 shrink-0 mt-0.5 ${tier.highlighted ? "text-indigo-200" : "text-indigo-500 dark:text-indigo-400"
                                        }`} />
                                    <span className={`${tier.highlighted ? "text-indigo-50" : "text-gray-700 dark:text-gray-300"
                                        }`}>
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <a
                            href={tier.ctaHref}
                            className={`block text-center font-semibold py-3 rounded-lg transition-colors ${tier.highlighted
                                ? "bg-white text-indigo-600 hover:bg-indigo-50"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                                }`}
                        >
                            {tier.cta}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    </section>
}

function FAQSection() {
    return <section id="faq" className="py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
                Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
                Everything you need to know about [synk].
            </p>
            <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-gray-200 dark:border-white/10">
                        <AccordionTrigger className="text-base text-gray-900 dark:text-gray-100 hover:no-underline">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base  text-gray-600 dark:text-gray-300">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    </section>
}

function ContactSection() {
    return <section id="contact" className="py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Get in Touch
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-xl mx-auto">
                Have questions, feedback, or want to explore enterprise options? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                    href="mailto:ophirgal2@gmail.com"
                    className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/60 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 text-gray-900 dark:text-gray-100 hover:ring-indigo-400 transition-all"
                >
                    <Mail className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    ophirgal2@gmail.com
                </a>
                <a
                    href="https://github.com/ophirgal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 rounded-lg bg-white/60 dark:bg-white/5 ring-1 ring-gray-200 dark:ring-white/10 text-gray-900 dark:text-gray-100 hover:ring-indigo-400 transition-all"
                >
                    <svg className="h-5 w-5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub
                </a>
            </div>
        </div>
    </section>
}