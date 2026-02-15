import { animalImageMap } from "@/components/ReactAnimal/component/AnimalIcons"

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
    { href: "/#contact", label: "Contact" },
]

const LOCAL_VIDEO_ELEMENT_ID = "local-video"

const TEXT_EDITOR_YTEXT_ID = "text-editor"
const TEXT_EDITOR_DEFAULT_TEXT = "Free text goes here... [synk] away!"

const ANIMAL_NAMES = Object.keys(animalImageMap)

const SMALL_SCREEN_WIDTH = 640

export {
    navLinks,
    LOCAL_VIDEO_ELEMENT_ID,
    TEXT_EDITOR_YTEXT_ID,
    TEXT_EDITOR_DEFAULT_TEXT,
    ANIMAL_NAMES,
    SMALL_SCREEN_WIDTH,
}