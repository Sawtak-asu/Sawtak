"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "motion/react";

// Floating shapes that move at different speeds based on scroll
export function ParallaxShapes() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    // Different speeds for depth effect
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -400]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -150]);
    const y4 = useTransform(scrollYProgress, [0, 1], [0, -300]);

    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -90]);
    const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 120]);

    const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8]);
    const scale2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 1.3]);

    return (
        <div ref={ref} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Geometric shapes */}

            {/* Large ring - top right */}
            <motion.div
                style={{ y: y1, rotate: rotate1 }}
                className="absolute -top-20 -right-20 w-80 h-80 border-2 border-primary/10 rounded-full"
            />

            {/* Small filled circle - left side */}
            <motion.div
                style={{ y: y2, scale: scale1 }}
                className="absolute top-1/4 -left-10 w-24 h-24 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-sm"
            />

            {/* Diamond shape - right side, middle */}
            <motion.div
                style={{ y: y3, rotate: rotate2 }}
                className="absolute top-1/2 right-10 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rotate-45"
            />

            {/* Triangle - bottom left */}
            <motion.div
                style={{ y: y4, rotate: rotate3 }}
                className="absolute bottom-1/4 left-1/4 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[52px] border-l-transparent border-r-transparent border-b-primary/10"
            />

            {/* Dotted circle - center right */}
            <motion.div
                style={{ y: y2, scale: scale2 }}
                className="absolute top-2/3 right-1/4 w-40 h-40 rounded-full border-2 border-dashed border-primary/5"
            />

            {/* Gradient blob 1 */}
            <motion.div
                style={{ y: y1 }}
                className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl"
            />

            {/* Gradient blob 2 */}
            <motion.div
                style={{ y: y3 }}
                className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-2xl"
            />
        </div>
    );
}

// Scroll progress indicator at the top of the page
export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <motion.div
            style={{ scaleX, transformOrigin: "left" }}
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500 z-50"
        />
    );
}

// Mouse-following spotlight effect for hero section
export function MouseSpotlight({ children, className }: { children: React.ReactNode; className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const background = useMotionTemplate`
        radial-gradient(
            600px circle at ${mouseX}px ${mouseY}px,
            rgba(var(--primary-rgb, 59, 130, 246), 0.06),
            transparent 80%
        )
    `;

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            style={{ background }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Parallax section wrapper with depth effect
export function ParallaxSection({
    children,
    speed = 0.5,
    className
}: {
    children: React.ReactNode;
    speed?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
    const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

    return (
        <div ref={ref} className={className}>
            <motion.div style={{ y: smoothY }}>
                {children}
            </motion.div>
        </div>
    );
}

// Floating element that responds to scroll with configurable options
export function FloatingElement({
    children,
    yOffset = [-50, 50],
    rotateRange = [0, 0],
    scaleRange = [1, 1],
    className
}: {
    children: React.ReactNode;
    yOffset?: [number, number];
    rotateRange?: [number, number];
    scaleRange?: [number, number];
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], yOffset);
    const rotate = useTransform(scrollYProgress, [0, 1], rotateRange);
    const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

    const smoothY = useSpring(y, { stiffness: 50, damping: 20 });
    const smoothRotate = useSpring(rotate, { stiffness: 50, damping: 20 });
    const smoothScale = useSpring(scale, { stiffness: 50, damping: 20 });

    return (
        <div ref={ref} className={className}>
            <motion.div style={{ y: smoothY, rotate: smoothRotate, scale: smoothScale }}>
                {children}
            </motion.div>
        </div>
    );
}

// Text that reveals with a gradient mask as you scroll
export function ScrollRevealText({
    children,
    className
}: {
    children: string;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.9", "start 0.3"]
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
    const y = useTransform(scrollYProgress, [0, 1], [30, 0]);
    const blur = useTransform(scrollYProgress, [0, 1], [8, 0]);

    const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
    const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
    const filterBlur = useMotionTemplate`blur(${blur}px)`;

    return (
        <motion.div
            ref={ref}
            style={{
                opacity: smoothOpacity,
                y: smoothY,
                filter: filterBlur
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// 3D tilt card effect on hover
export function TiltCard({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        rotateX.set(-mouseY / 20);
        rotateY.set(mouseX / 20);
    };

    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
    };

    const smoothRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
    const smoothRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: smoothRotateX,
                rotateY: smoothRotateY,
                transformStyle: "preserve-3d",
                perspective: 1000
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Staggered reveal for lists/grids
export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1
}: {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
