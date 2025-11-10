
"use client";

import React from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
    animationData: any;
    className?: string;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({ animationData, className }) => {
    return (
        <div className={className}>
            <Lottie animationData={animationData} loop={true} />
        </div>
    );
};
