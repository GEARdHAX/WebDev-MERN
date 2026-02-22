"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HEADLINE = "WELCOME ITZFIZZ";

const STATS = [
  { id: "box1", value: "58%", label: "Increase in pick up point use", bg: "#def54f", color: "#111", top: "5%", right: "30%", bottom: "auto", },
  { id: "box2", value: "23%", label: "Decreased in customer phone calls", bg: "#6ac9ff", color: "#111", top: "auto", right: "35%", bottom: "5%", },
  { id: "box3", value: "27%", label: "Increase in pick up point use", bg: "#333", color: "#fff", top: "5%", right: "10%", bottom: "auto", },
  { id: "box4", value: "40%", label: "Decreased in customer phone calls", bg: "#fa7328", color: "#111", top: "auto", right: "12.5%", bottom: "5%", },
];

export default function Home() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLImageElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const valueAddRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const car = carRef.current;
      const trail = trailRef.current;
      const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[];
      const valueAdd = valueAddRef.current;

      const road = roadRef.current;
      if (!car || !trail || !valueAdd || !road || letters.length === 0) return;

      const valueRect = valueAdd.getBoundingClientRect();
      const letterOffsets = letters.map((letter) => letter.offsetLeft);

      const roadWidth = window.innerWidth;
      const carWidth = 150; // explicitly defined in reference
      const endX = roadWidth - carWidth;

      // Main car scroll animation
      gsap.to(car, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerWidth * 2}`, // Gives 200vw of scroll distance
          scrub: true,
          pin: ".track",
        },
        x: endX,
        ease: "none",
        onUpdate: function () {
          const carX = (gsap.getProperty(car, "x") as number) + carWidth / 2;

          // Reveal letters as the car passes over them
          letters.forEach((letter, i) => {
            const letterX = valueRect.left + letterOffsets[i];
            if (carX >= letterX) {
              letter.style.opacity = "1";
            } else {
              letter.style.opacity = "0";
            }
          });

          // Trail follows the car
          gsap.set(trail, { width: carX });
        },
      });

      // Stat boxes fade in dynamically based on the total scroll distance
      const distance = window.innerWidth * 2;
      const scrollStarts = [distance * 0.2, distance * 0.4, distance * 0.6, distance * 0.8];
      const scrollEnds = [distance * 0.3, distance * 0.5, distance * 0.7, distance * 0.9];

      STATS.forEach((stat, i) => {
        gsap.to(`#${stat.id}`, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top+=${scrollStarts[i]} top`,
            end: `top+=${scrollEnds[i]} top`,
            scrub: true,
          },
          opacity: 1,
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <main className="bg-[#121212] text-white font-sans overflow-x-hidden">
      {/* Section height is managed by GSAP pinning, we just need a block */}
      <div ref={sectionRef} className="section relative bg-[#121212]">
        {/* Sticky Track: stays visible while section scrolls */}
        <div className="track h-screen w-full flex items-center justify-center bg-[#d1d1d1]">
          {/* Road */}
          <div ref={roadRef} className="road relative w-screen h-[200px] bg-[#1e1e1e] overflow-hidden">
            {/* Car */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={carRef}
              src="/car.svg"
              alt="car"
              className="absolute top-0 left-0 z-10 h-[200px] w-[150px] object-contain"
            />

            {/* Trail */}
            <div
              ref={trailRef}
              className="absolute top-0 left-0 h-[200px] w-0 bg-[#45db7d] z-[1]"
            />

            {/* Letter-spaced headline inside the road */}
            <div
              ref={valueAddRef}
              className="value-add absolute z-[5] flex gap-[0.3rem]"
              style={{ top: "30%", left: "5%", fontSize: "8rem", fontWeight: "bold" }}
            >
              {HEADLINE.split("").map((char, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    lettersRef.current[i] = el;
                  }}
                  className="value-letter text-[#111] opacity-0 transition-none"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </div>

          {/* Stat Boxes - positioned absolutely around the track */}
          {STATS.map((stat) => (
            <div
              key={stat.id}
              id={stat.id}
              className="stat-box absolute z-[5] flex flex-col justify-center items-start gap-[5px] p-[30px] rounded-[10px] m-4 opacity-0 transition-opacity duration-500"
              style={{
                backgroundColor: stat.bg,
                color: stat.color,
                top: stat.top !== "auto" ? stat.top : undefined,
                bottom: stat.bottom !== "auto" ? stat.bottom : undefined,
                right: stat.right,
                fontSize: "18px",
              }}
            >
              <span className="text-[58px] font-semibold leading-none">{stat.value}</span>
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
