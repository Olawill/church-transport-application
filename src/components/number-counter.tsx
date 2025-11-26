import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface NumberCounterProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  formatCurrency?: boolean;
  fadeDuration?: number;
  animationOffset?: number;
}

export const NumberCounter = ({
  from = 0,
  to = 1000,
  duration = 2,
  decimals = 0,
  formatCurrency = false,
  fadeDuration = 0.8,
  animationOffset = 30,
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
    () => {
      const element = elementRef.current!;

      // master timeline for fade/slide + count
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
      });

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
