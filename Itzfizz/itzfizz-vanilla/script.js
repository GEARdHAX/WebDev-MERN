gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
    const HEADLINE = "WELCOME ITZFIZZ";
    const valueTextContainer = document.getElementById("valueText");

    // Inject letters
    HEADLINE.split("").forEach(char => {
        const span = document.createElement("span");
        span.className = "value-letter";
        span.innerHTML = char === " " ? "&nbsp;" : char;
        valueTextContainer.appendChild(span);
    });

    const car = document.getElementById("car");
    const trail = document.getElementById("trail");
    const letters = gsap.utils.toArray(".value-letter");

    const valueRect = valueTextContainer.getBoundingClientRect();
    const letterOffsets = letters.map(letter => letter.offsetLeft);

    const roadWidth = window.innerWidth;
    const carWidth = 150;
    const endX = roadWidth - carWidth;

    const distance = window.innerWidth * 2; // Total scroll distance

    // Main car scroll animation
    gsap.to(car, {
        scrollTrigger: {
            trigger: ".section",
            start: "top top",
            end: () => `+=${distance}`,
            scrub: true,
            pin: ".track",
        },
        x: endX,
        ease: "none",
        onUpdate: function () {
            const carX = gsap.getProperty(car, "x") + carWidth / 2;

            // Reveal letters as the car passes
            letters.forEach((letter, i) => {
                const letterX = valueRect.left + letterOffsets[i];
                if (carX >= letterX) {
                    letter.style.opacity = 1;
                } else {
                    letter.style.opacity = 0;
                }
            });

            // Update trail width
            gsap.set(trail, { width: carX });
        },
    });

    // Stat boxes fade in
    const stats = ["#box1", "#box2", "#box3", "#box4"];
    const scrollStarts = [distance * 0.2, distance * 0.4, distance * 0.6, distance * 0.8];
    const scrollEnds = [distance * 0.3, distance * 0.5, distance * 0.7, distance * 0.9];

    stats.forEach((selector, i) => {
        gsap.to(selector, {
            scrollTrigger: {
                trigger: ".section",
                start: `top+=${scrollStarts[i]} top`,
                end: `top+=${scrollEnds[i]} top`,
                scrub: true,
            },
            opacity: 1,
        });
    });
});
