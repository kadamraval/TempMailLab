
"use client";

import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LottieAnimationProps {
    animationData: any;
    className?: string;
    isHovered?: boolean;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({ animationData, className, isHovered }) => {
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (lottieRef.current) {
            if (isHovered) {
                lottieRef.current.play();
            } else {
                lottieRef.current.stop();
            }
        }
    }, [isHovered]);

    return (
        <div className={className}>
            <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={false}
                autoplay={false}
            />
        </div>
    );
};
