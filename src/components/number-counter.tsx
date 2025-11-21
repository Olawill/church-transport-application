import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface NumberCounterProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number; // number of decimals to display
  formatCurrency?: boolean; // show as $1,234.56

  fadeDuration?: number;
  animationOffset?: number;
}

export const NumberCounter = ({
  from = 0,
  to = 1000,
  duration = 2,
  decimals = 0,
  formatCurrency = false,
  fadeDuration = 0.6,
  animationOffset = 20,
}: NumberCounterProps) => {
  const [display, setDisplay] = useState<string | number>(from);
  const valueRef = useRef({ val: from });
  const elementRef = useRef<HTMLSpanElement>(null);

  //   useEffect(() => {
  //   gsap.to(valueRef.current, {
  //     val: to,
  //     duration,
  //     ease: "power1.out",
  //     onUpdate: () => {
  //       let val: number | string = valueRef.current.val;

  //       if (decimals > 0) {
  //         val = parseFloat(val.toFixed(decimals));
  //       } else {
  //         val = Math.round(val);
  //       }

  //       if (formatCurrency) {
  //         val = new Intl.NumberFormat("en-US", {
  //           style: "currency",
  //           currency: "USD",
  //           minimumFractionDigits: decimals,
  //           maximumFractionDigits: decimals,
  //         }).format(val);
  //       }

  //       setDisplay(val);
  //     },
  //   });
  // }, [from, to, duration, decimals, formatCurrency]);

  useGSAP(
    (context) => {
      const element = elementRef.current!;

      // master timeline for fade/slide + count
      const tl = gsap.timeline({ paused: true });

      // Fade + slide-up animation
      tl.from(element, {
        opacity: 0,
        y: animationOffset,
        duration: fadeDuration,
        ease: "power3.out",
      });

      // Counter animation
      tl.to(
        valueRef.current,
        {
          val: to,
          duration,
          ease: "power3.out", // smoother easing
          onUpdate: () => {
            let val: string | number = valueRef.current.val;

            // Round to decimals
            if (decimals > 0) {
              val = parseFloat(val.toFixed(decimals));
            } else {
              val = Math.round(val);
            }

            // Format as currency if needed
            if (formatCurrency) {
              val = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }).format(val);
            }

            setDisplay(val);
          },
        },
        "<" // start counter at the same time as fade/slide
      );

      // const animate = () => {
      //   // Reset before playing again
      //   valueRef.current.val = from;
      //   setDisplay(from);

      //   gsap.to(valueRef.current, {
      //     val: to,
      //     duration,
      //     ease: "power3.out", // smoother easing
      //     onUpdate: () => {
      //       let val: string | number = valueRef.current.val;

      //       // Round to decimals
      //       if (decimals > 0) {
      //         val = parseFloat(val.toFixed(decimals));
      //       } else {
      //         val = Math.round(val);
      //       }

      //       // Format as currency if needed
      //       if (formatCurrency) {
      //         val = new Intl.NumberFormat("en-US", {
      //           style: "currency",
      //           currency: "USD",
      //           minimumFractionDigits: decimals,
      //           maximumFractionDigits: decimals,
      //         }).format(val);
      //       }

      //       setDisplay(val);
      //     },
      //   });
      // };

      ScrollTrigger.create({
        trigger: elementRef.current,
        start: "top 80%",
        // onEnter: animate,
        // onEnterBack: animate,
        onEnter: () => tl.restart(),
        onEnterBack: () => tl.restart(),
      });
    },
    {
      scope: elementRef,
      dependencies: [from, to, duration, decimals, formatCurrency],
    }
  );

  return (
    <span ref={elementRef} className="text-4xl font-bold">
      {display}
    </span>
  );
};

export const FlipDigit = ({ value }: { value: string }) => {
  const [prev, setPrev] = useState(value);
  const topFlip = useRef<HTMLDivElement>(null);
  const bottomFlip = useRef<HTMLDivElement>(null);
  const topStatic = useRef<HTMLDivElement>(null);
  const bottomStatic = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === prev) return;

    const tl = gsap.timeline({
      onComplete: () => setPrev(value),
    });

    // Show flip panels and set initial state
    tl.set(topFlip.current, { display: "block", rotationX: 0 });
    tl.set(bottomFlip.current, { display: "block", rotationX: 90 });

    // 1️⃣ Top flip (prev → value) - flips down
    tl.to(topFlip.current, {
      rotationX: -90,
      duration: 0.3,
      ease: "power2.in",
      transformOrigin: "bottom center",
    });

    // Switch bottom static to new value
    tl.call(() => {
      if (bottomStatic.current) {
        const inner = bottomStatic.current.querySelector("div");
        if (inner) inner.textContent = value;
      }
    });

    // 2️⃣ Bottom flip (value comes in) - flips from top
    tl.to(
      bottomFlip.current,
      {
        rotationX: 0,
        duration: 0.3,
        ease: "power2.out",
        transformOrigin: "top center",
      },
      "-=0.15" // Overlap slightly
    );

    // Update top static and hide flip panels
    tl.call(() => {
      if (topStatic.current) {
        const inner = topStatic.current.querySelector("div");
        if (inner) inner.textContent = value;
      }
    });
    tl.set([topFlip.current, bottomFlip.current], { display: "none" });
  }, [value, prev]);

  return (
    <div
      className="relative w-12 h-16 text-4xl font-bold"
      style={{ perspective: "1000px" }}
    >
      {/* STATIC TOP HALF */}
      <div
        ref={topStatic}
        className="absolute top-0 left-0 w-full bg-black text-white rounded-t overflow-hidden"
        style={{
          height: "50%",
          zIndex: 1,
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
          {prev}
        </div>
      </div>

      {/* STATIC BOTTOM HALF */}
      <div
        ref={bottomStatic}
        className="absolute bottom-0 left-0 w-full bg-black text-white rounded-b overflow-hidden"
        style={{
          height: "50%",
          zIndex: 1,
        }}
      >
        <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
          {prev}
        </div>
      </div>

      {/* TOP FLIP PANEL */}
      <div
        ref={topFlip}
        className="absolute top-0 left-0 w-full bg-black text-white rounded-t overflow-hidden"
        style={{
          height: "50%",
          zIndex: 3,
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          display: "none", // Hidden by default
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[200%] flex items-center justify-center">
          {prev}
        </div>
      </div>

      {/* BOTTOM FLIP PANEL */}
      <div
        ref={bottomFlip}
        className="absolute bottom-0 left-0 w-full bg-black text-white rounded-b overflow-hidden"
        style={{
          height: "50%",
          zIndex: 3,
          backfaceVisibility: "hidden",
          transformStyle: "preserve-3d",
          display: "none", // Hidden by default
        }}
      >
        <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-center justify-center">
          {value}
        </div>
      </div>

      {/* CENTER LINE */}
      {/* <div
        className="absolute left-0 right-0 h-[1px] bg-gray-600"
        style={{ top: "50%", zIndex: 4, transform: "translateY(-0.5px)" }}
      /> */}
    </div>
  );
};

export const FlipCounter = ({
  from = 0,
  to,
  duration = 2,
  decimals = 0,
  formatCurrency = false,
}: NumberCounterProps) => {
  const [value, setValue] = useState(from);

  // Animate numeric interpolation
  useEffect(() => {
    const start = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const current = from + (to - from) * progress;
      setValue(current);

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, [from, to, duration]);

  // Format number
  let formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  if (formatCurrency) {
    formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(formatted));
  }

  return (
    <div className="flex gap-1">
      {formatted.split("").map((char, i) =>
        /\d/.test(char) ? (
          <FlipDigit key={i} value={char} />
        ) : (
          <span key={i} className="text-3xl font-bold">
            {char}
          </span>
        )
      )}
    </div>
  );
};
