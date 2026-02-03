const ANIMAL_COLORS = {
    red: "#FF0044",
    blue: "#006CFE",
    yellow: "#FFCC41",
    purple: "#B476FB",
    indigo: "#615fff",
    orange: "#FE9D24",
    green: "#29B278",
    teal: "#00D7BF",
} as const;
type AnimalColorsType = typeof ANIMAL_COLORS;

export const getAnimalColorByKey = (key: string): AnimalColorsType[keyof AnimalColorsType] => {
    if (key in ANIMAL_COLORS) {
        return ANIMAL_COLORS[key as keyof AnimalColorsType];
    }

    return '#FF0044';
};
