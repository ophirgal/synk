// import React from 'react';
import { getAnimalColorByKey } from './constants';
import "../styles/ReactAnimal.css";
import { animalImageMap, animalNames, type ReactAnimalNames } from './AnimalIcons';

export type ReactAnimalColors = 
    | 'red'
    | 'blue'
    | 'yellow'
    | 'purple'
    | 'indigo'
    | 'orange'
    | 'green'
    | 'teal';

export type ReactAnimalProps = {
    name?: ReactAnimalNames;
    color?: ReactAnimalColors;
    size?: ( 'sm' | 'md' | 'lg' ) | ( string & {} ) ;
    shape?: 'circle' | 'square' | 'rounded';
    dance?: boolean;
    onClick?: () => void;
};

export const ReactAnimal = ({ name, color, shape, size, dance, onClick }: ReactAnimalProps) => {
    const getAnimalIcon = () => {
        if (name !== undefined && animalImageMap[name] !== undefined) {
            return animalImageMap[name];
        }

        const randomIndex = Math.floor(Math.random() * animalNames.length);

        return animalImageMap[animalNames[randomIndex]];
    };

    const getSize = (size: ReactAnimalProps['size']): string => {
        switch (size) {
            case 'sm':
                return '40px';
            case 'md':
                return '70px';
            case 'lg':
                return '125px';
            default:
                if (size !== undefined && size.match(/(^\d*)(em|ex|%|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)/)) {
                    return size;
                }

                return '70px';
        }
    };

    const getColor = (color?: ReactAnimalColors): string => {
        if (color === undefined) return 'red';

        return getAnimalColorByKey(color);
    };

    const getRadius = (shape: ReactAnimalProps['shape']): string => {
        switch (shape) {
            case 'circle':
                return '50%';
            case 'square':
                return '0%';
            case 'rounded':
                return '10%';
            default:
                return '10%';
        }
    };

    const animalSize = getSize(size);
    const avatarStyle = {
        'height': animalSize,
        'width': animalSize,
        'borderRadius': getRadius(shape),
        'backgroundColor': getColor(color),
    };

    return (
        <div 
            className="v-animal-avatar"
            style={avatarStyle}
            onClick={onClick}
            aria-label={`animal-avatar-${name}`}
            role="img"
        >
            <img
                src={getAnimalIcon()}
                alt={`animal-avatar-${name}`}
                style={{ 'height': '80%', 'width': '80%' }}
                className={dance ? 'v-animal-image v-animal-dance' : 'v-animal-image'}
                data-testid="animalIcon"
            />
        </div>
    );
};
